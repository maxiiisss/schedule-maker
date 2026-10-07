"use client"

import { useEffect, useState } from "react"

/**
 * Current date, refreshed on an interval. Returns null until mounted so
 * server and client markup match on first render.
 */
export function useNow(intervalMs = 30_000): Date | null {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const id = window.setInterval(tick, intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}
