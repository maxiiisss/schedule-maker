"use client"

import { X } from "lucide-react"
import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"

interface DrawerProps {
  open: boolean
  onClose: () => void
  /** Accessible name of the panel. */
  label: string
  children: React.ReactNode
}

/**
 * Side menu that slides in from the left, like the one in Google Calendar.
 * Phones only. Closes with Escape, a tap outside, or the close button; keeps
 * Tab inside while open and returns focus to the button that opened it.
 */
export function Drawer({ open, onClose, label, children }: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = "hidden"

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
        return
      }
      if (event.key !== "Tab" || !panelRef.current) return

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    panelRef.current?.querySelector<HTMLElement>("button")?.focus()

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = overflow
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-50 sm:hidden">
      <button
        type="button"
        aria-label="Cerrar menú"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] animate-in fade-in"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="absolute inset-y-0 left-0 flex w-[86%] max-w-[330px] flex-col border-r border-border bg-sidebar pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-[8px_0_40px_rgb(0_0_0/0.5)] animate-in slide-in-from-left duration-200"
      >
        <div className="flex justify-end px-2 pt-2">
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar menú">
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain pb-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
