"use client"

import { X } from "lucide-react"
import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"

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
      document.body.style.overflow = overflow
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        tabIndex={-1}
        className="absolute inset-0 bg-black/55 backdrop-blur-[3px] animate-in fade-in"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        aria-describedby={description ? descId.current : undefined}
        className="relative z-10 flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-xl border border-input bg-popover text-popover-foreground shadow-[0_24px_70px_rgb(0_0_0/0.6)] animate-in slide-in-from-bottom-4 sm:max-w-md sm:rounded-xl sm:zoom-in-95"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
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

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer ? (
          <footer className="border-t border-border px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</footer>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
