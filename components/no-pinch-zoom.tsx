"use client"

import { useEffect } from "react"

/**
 * iPhone Safari ignores `user-scalable=no` and still lets people pinch the page.
 * Its non-standard gesture events are the only hook to stop that.
 */
export function NoPinchZoom() {
  useEffect(() => {
    const stop = (event: Event) => event.preventDefault()
    const events = ["gesturestart", "gesturechange", "gestureend"] as const
    for (const name of events) document.addEventListener(name, stop)
    return () => {
      for (const name of events) document.removeEventListener(name, stop)
    }
  }, [])

  return null
}
