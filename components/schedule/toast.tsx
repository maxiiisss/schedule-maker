"use client"

import { cn } from "@/lib/utils"

interface ToastProps {
  message: string | null
  actionLabel?: string
  onAction?: () => void
}

/** Bottom notice with an optional single action (used for "Deshacer"). */
export function Toast({ message, actionLabel, onAction }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 transition-all duration-200",
        message ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
    >
      {message ? (
        <div className="pointer-events-auto flex items-center gap-4 rounded-xl border border-input bg-popover px-4 py-2.5 text-sm shadow-2xl">
          <span>{message}</span>
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="rounded font-medium text-sky focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
