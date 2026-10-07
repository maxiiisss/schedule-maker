import { NextResponse } from "next/server"

import { SHARE_ID_PATTERN, tokenMatches } from "@/lib/share/ids"
import { getShareStore } from "@/lib/share/store"

export const dynamic = "force-dynamic"

/** Read a shared schedule (the same data the public page shows). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const store = getShareStore()

  if (!store) return NextResponse.json({ error: "Sharing is not configured." }, { status: 503 })
  if (!SHARE_ID_PATTERN.test(id)) return NextResponse.json({ error: "Not found." }, { status: 404 })

  const forwarded = request.headers.get("x-forwarded-for")
  const caller = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
  if (!(await store.allow(`read:${caller}`))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 })
  }

  const record = await store.get(id)
  if (!record) return NextResponse.json({ error: "Not found." }, { status: 404 })

  await store.renew(id)
  return NextResponse.json({ name: record.name, courses: record.courses })
}

/** Revoke a share link. Requires the edit token returned when it was created. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const token = request.headers.get("x-edit-token")
  const store = getShareStore()

  if (!store) return NextResponse.json({ error: "Sharing is not configured." }, { status: 503 })
  if (!SHARE_ID_PATTERN.test(id) || !token) {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }

  const record = await store.get(id)
  if (!record) return NextResponse.json({ error: "Not found." }, { status: 404 })
  if (!tokenMatches(token, record.tokenHash)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 })
  }

  await store.remove(id)
  return new NextResponse(null, { status: 204 })
}
