"use client"

import type { LucideIcon } from "lucide-react"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"

/** Fixed bar at the bottom of the screen on phones. Hidden from 640 px up. */
export function MobileBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <nav
      aria-label="Acciones"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-sidebar/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 sm:hidden",
        className,
      )}
    >
      {children}
    </nav>
  )
}

export interface MobileBarItem {
  label: string
  icon: LucideIcon
  onClick: () => void
  /** Small count over the icon, e.g. people being compared. */
  badge?: number
  /** Celeste tint for the actions that involve other people. */
  accent?: boolean
}

/** Icon-over-label buttons, like the toolbar of Calendar on iPhone. */
export function MobileActionBar({ items }: { items: MobileBarItem[] }) {
  return (
    <MobileBar>
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              onClick={item.onClick}
              className={cn(
                "relative flex w-full flex-col items-center gap-0.5 px-1 pb-1.5 pt-2 text-[11px] font-medium transition-colors active:bg-white/[0.06] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                item.accent ? "text-sky" : "text-muted-foreground",
              )}
            >
              <span className="relative">
                <item.icon className="size-[22px]" aria-hidden />
                {item.badge ? (
                  <span className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-sky px-1 text-[10px] font-semibold text-[#06222e]">
                    {item.badge}
                  </span>
                ) : null}
              </span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </MobileBar>
  )
}

/** Round "add" button floating above the bottom bar, like Google Calendar. */
export function MobileFab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_20px_rgb(0_0_0/0.45)] transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:hidden"
    >
      <Plus className="size-7" strokeWidth={2.25} aria-hidden />
    </button>
  )
}
