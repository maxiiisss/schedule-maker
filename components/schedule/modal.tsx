"use client"

import { X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"
import { useScrollLock } from "@/hooks/use-scroll-lock"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  /** Optional footer (actions). Rendered sticky at the bottom. */
  footer?: React.ReactNode
}

/**
 * Lightweight, accessible modal dialog.
 *
 * Handles Escape-to-close, backdrop click, body scroll lock, initial focus
 * and focus restoration. Kept presentation-only so it can wrap any content.
 */
export function Modal({ open, onClose, title, description, children, footer }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2)}`)
  const descId = useRef(`modal-desc-${Math.random().toString(36).slice(2)}`)
  const drag = useRef<{ startY: number; startTime: number } | null>(null)
  // After closing, keep the dialog mounted for its exit animation (not after a drag-dismiss,
  // where the sheet is already off screen).
  const [exiting, setExiting] = useState(false)
  const skipExit = useRef(false)

  // Freeze the page behind the sheet, also on iOS where `overflow: hidden` is not enough.
  useScrollLock(open)

  useEffect(() => {
    if (open) return
    if (skipExit.current) {
      skipExit.current = false
      return
    }
    setExiting(true)
    const timer = window.setTimeout(() => setExiting(false), 200)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
        return
      }
      if (event.key !== "Tab" || !panelRef.current) return

      // Keep Tab inside the dialog.
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'input:not([readonly]), select, textarea, button:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

    // Focus the first focusable element inside the panel.
    const focusable = panelRef.current?.querySelector<HTMLElement>(
      'input, select, textarea, button, [tabindex]:not([tabindex="-1"])',
    )
    focusable?.focus()

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  // Phones only: drag the handle down to dismiss the sheet. Plain pointer events, no library.
  const dragOffset = (event: React.PointerEvent) =>
    drag.current ? Math.max(0, event.clientY - drag.current.startY) : 0

  const onDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { startY: event.clientY, startTime: event.timeStamp }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // the pointer is already gone: dragging simply will not track outside the handle
    }
    if (panelRef.current) panelRef.current.style.transition = "none"
  }

  const onDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current || !panelRef.current) return
    panelRef.current.style.transform = `translateY(${dragOffset(event)}px)`
  }

  const onDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const current = drag.current
    const panel = panelRef.current
    const distance = dragOffset(event)
    drag.current = null
    if (!current || !panel) return

    const speed = distance / Math.max(1, event.timeStamp - current.startTime)
    if (event.type === "pointerup" && (distance > 96 || (distance > 40 && speed > 0.6))) {
      skipExit.current = true
      onClose()
      return
    }
    // Not far enough (or cancelled): spring back.
    panel.style.transition = "transform 160ms ease-out"
    panel.style.transform = ""
  }

  if ((!open && !exiting) || typeof document === "undefined") return null
  const closing = !open

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] sm:items-center">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        tabIndex={-1}
        className={cn(
          "absolute inset-0 touch-none bg-black/55 backdrop-blur-[3px] duration-200",
          closing ? "animate-out fade-out fill-mode-forwards" : "animate-in fade-in",
        )}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        aria-describedby={description ? descId.current : undefined}
        className={cn(
          "relative z-10 flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-xl border border-input bg-popover pb-[env(safe-area-inset-bottom)] text-popover-foreground shadow-[0_24px_70px_rgb(0_0_0/0.6)] ease-out sm:max-w-md sm:rounded-xl sm:pb-0",
          closing
            ? "animate-out fade-out slide-out-to-bottom duration-200 fill-mode-forwards sm:slide-out-to-bottom-2 sm:zoom-out-95 sm:duration-150"
            : "animate-in fade-in slide-in-from-bottom duration-300 sm:slide-in-from-bottom-2 sm:zoom-in-95 sm:duration-200",
        )}
      >
        {/* Handle: 36 x 4 px bar inside a 44 px touch area. Phones only. */}
        <div
          aria-hidden
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          className="absolute left-1/2 top-0 z-10 flex h-11 w-40 -translate-x-1/2 cursor-grab touch-none items-start justify-center pt-2 sm:hidden"
        >
          <span className="h-1 w-9 rounded-full bg-muted-foreground/40" />
        </div>

        <header className="flex items-start justify-between gap-4 border-b border-border px-5 pb-4 pt-6 sm:px-6 sm:py-4">
          <div className="space-y-0.5">
            <h2 id={titleId.current} className="text-[15px] font-semibold tracking-tight">
              {title}
            </h2>
            {description ? (
              <p id={descId.current} className="text-[13px] text-muted-foreground text-pretty">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="-mr-2 -mt-1 shrink-0"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>

        {footer ? (
          <footer className="border-t border-border px-5 py-3.5 sm:px-6">{footer}</footer>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
