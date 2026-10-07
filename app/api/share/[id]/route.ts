import { NextResponse } from "next/server"

import { SHARE_ID_PATTERN, tokenMatches } from "@/lib/share/ids"
import { getShareStore } from "@/lib/share/store"

export const dynamic = "force-dynamic"

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
