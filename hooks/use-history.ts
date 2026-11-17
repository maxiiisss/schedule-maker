"use client"

import { useCallback, useEffect, useState } from "react"

import {
  HISTORY_CHANGED_EVENT,
  HISTORY_STORAGE_KEY,
  readHistory,
  withoutHistoryEntry,
  writeHistory,
  type HistoryEntry,
} from "@/lib/schedule/history"

/**
 * Schedules that were compared before, kept on this device.
 * Loaded after mount so server and client markup match; follows changes made by
 * other tabs and by the comparison itself.
 */
export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    const reload = () => setHistory(readHistory())
    const onStorage = (event: StorageEvent) => {
      if (event.key === HISTORY_STORAGE_KEY || event.key === null) reload()
    }
    reload()
    window.addEventListener(HISTORY_CHANGED_EVENT, reload)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(HISTORY_CHANGED_EVENT, reload)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const forget = useCallback((sourceId: string) => {
    writeHistory(withoutHistoryEntry(readHistory(), sourceId))
  }, [])

  const clear = useCallback(() => writeHistory([]), [])

  return { history, forget, clear }
}
