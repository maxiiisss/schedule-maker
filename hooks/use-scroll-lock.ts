"use client"

import { useEffect } from "react"

let locks = 0
let saved: { scrollY: number; styles: Record<string, string> } | null = null

const LOCKED_PROPS = ["position", "top", "left", "right", "overflow", "paddingRight"] as const

function lock() {
  const { body, documentElement } = document
  const scrollY = window.scrollY
  // On desktop the scrollbar disappears when scrolling stops; keep its width so nothing shifts.
  const scrollbar = window.innerWidth - documentElement.clientWidth

  saved = {
    scrollY,
    styles: Object.fromEntries(LOCKED_PROPS.map((prop) => [prop, body.style[prop]])),
  }

  // `overflow: hidden` alone does not stop iOS Safari from scrolling the page behind a sheet.
  // Pinning the body in place does, and the offset keeps the page where it was.
  body.style.position = "fixed"
  body.style.top = `-${scrollY}px`
  body.style.left = "0"
  body.style.right = "0"
  body.style.overflow = "hidden"
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
}

function unlock() {
  if (!saved) return
  const { body } = document
  for (const prop of LOCKED_PROPS) body.style[prop] = saved.styles[prop]
  window.scrollTo(0, saved.scrollY)
  saved = null
}

/**
 * Freeze the page behind a dialog while `active` is true, then put it back exactly where it was.
 * Counts nested users, so two dialogs open at once release the page only when both are closed.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    if (locks === 0) lock()
    locks += 1
    return () => {
      locks -= 1
      if (locks === 0) unlock()
    }
  }, [active])
}
