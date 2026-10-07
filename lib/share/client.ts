import type { Course } from "@/lib/schedule/types"

const SHARE_KEY = "schedule:share:v1"
const NAME_KEY = "schedule:share-title"

/** A link the user created from this browser, with the secret to revoke it. */
export interface OwnShare {
  id: string
  url: string
  editToken: string
  /** Optional title of the schedule, as shown on the shared page. */
  name: string
  createdAt: number
}

export type ShareFailure = "rate-limited" | "unavailable" | "too-large" | "failed"

export type CreateShareResult =
  | { ok: true; share: OwnShare }
  | { ok: false; reason: ShareFailure }

export function loadOwnShare(): OwnShare | null {
  try {
    const raw = window.localStorage.getItem(SHARE_KEY)
    if (!raw) return null
    const share = JSON.parse(raw) as OwnShare
    return { ...share, name: share.name ?? "" }
  } catch {
    return null
  }
}

function saveOwnShare(share: OwnShare | null) {
  try {
    if (share) window.localStorage.setItem(SHARE_KEY, JSON.stringify(share))
    else window.localStorage.removeItem(SHARE_KEY)
  } catch {
    // storage unavailable: the link still works, it just cannot be revoked later
  }
}

export function loadShareName(): string {
  try {
    return window.localStorage.getItem(NAME_KEY) ?? ""
  } catch {
    return ""
  }
}

export function saveShareName(name: string) {
  try {
    window.localStorage.setItem(NAME_KEY, name)
  } catch {
    // ignore
  }
}

export async function createShare(name: string, courses: Course[]): Promise<CreateShareResult> {
  try {
    const response = await fetch("/api/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim(), courses }),
    })

    if (response.status === 429) return { ok: false, reason: "rate-limited" }
    if (response.status === 503) return { ok: false, reason: "unavailable" }
    if (response.status === 413) return { ok: false, reason: "too-large" }
    if (!response.ok) return { ok: false, reason: "failed" }

    const data = (await response.json()) as { id: string; url: string; editToken: string }
    const share: OwnShare = { ...data, name: name.trim(), createdAt: Date.now() }
    saveOwnShare(share)
    return { ok: true, share }
  } catch {
    return { ok: false, reason: "failed" }
  }
}

/** Revoke a link. A 404 means it already expired, which is the same outcome. */
export async function revokeShare(share: OwnShare): Promise<boolean> {
  try {
    const response = await fetch(`/api/share/${share.id}`, {
      method: "DELETE",
      headers: { "x-edit-token": share.editToken },
    })
    if (response.ok || response.status === 404) {
      saveOwnShare(null)
      return true
    }
    return false
  } catch {
    return false
  }
}
