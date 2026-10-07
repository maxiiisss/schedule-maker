import "server-only"

import { cache } from "react"

import { SHARE_ID_PATTERN } from "./ids"
import { getShareStore, type ShareRecord } from "./store"

/** Read a shared schedule once per request (page and metadata share the result). */
export const loadShared = cache(async (id: string): Promise<ShareRecord | null> => {
  if (!SHARE_ID_PATTERN.test(id)) return null
  const store = getShareStore()
  if (!store) return null
  return store.get(id)
})
