import { NextResponse } from "next/server"

import { createEditToken, createShareId, hashToken } from "@/lib/share/ids"
import { MAX_BODY_LENGTH, parseSharedSchedule } from "@/lib/share/schema"
import { getShareStore, SHARE_TTL_SECONDS } from "@/lib/share/store"

export const dynamic = "force-dynamic"

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
}

/** Create a share link for a schedule. */
export async function POST(request: Request) {
  const store = getShareStore()
  if (!store) {
    return NextResponse.json({ error: "Sharing is not configured." }, { status: 503 })
  }

  if (!(await store.allow(clientKey(request)))) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 })
  }

  const body = await request.text()
  if (body.length > MAX_BODY_LENGTH) {
    return NextResponse.json({ error: "The schedule is too large." }, { status: 413 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
  }

  const parsed = parseSharedSchedule(payload)
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const id = createShareId()
  const editToken = createEditToken()
  await store.save(id, {
    ...parsed.data,
    createdAt: Date.now(),
    tokenHash: hashToken(editToken),
  })

  const origin = new URL(request.url).origin
  return NextResponse.json(
    {
      id,
      url: `${origin}/v/${id}`,
      editToken,
      expiresAt: Date.now() + SHARE_TTL_SECONDS * 1000,
    },
    { status: 201 },
  )
}
