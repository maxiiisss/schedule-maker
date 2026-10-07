"use client"

import { cn } from "@/lib/utils"
import { DAYS } from "@/lib/schedule/constants"
import type { DayId } from "@/lib/schedule/types"

interface DayTabsProps {
  selected: DayId
  today: DayId | null
  /** Days that have at least one course. */
  busy: Set<DayId>
  onSelect: (day: DayId) => void
}

/** Seven-day picker for the single-day view. Fits a 360px phone without scrolling. */
export function DayTabs({ selected, today, busy, onSelect }: DayTabsProps) {
  return (
    <div
      role="group"
      aria-label="Día que se muestra"
      className="grid grid-cols-7 gap-1 rounded-xl border border-border bg-card p-1"
    >
      {DAYS.map((day) => {
        const active = day.id === selected
        return (
          <button
            key={day.id}
            type="button"
            aria-pressed={active}
            aria-label={`${day.label}${day.id === today ? " (hoy)" : ""}${busy.has(day.id) ? ", con clases" : ""}`}
            onClick={() => onSelect(day.id)}
            className={cn(
              "relative flex h-10 flex-col items-center justify-center rounded-lg text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
              active
                ? "bg-primary font-medium text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              !active && day.id === today && "text-sky",
            )}
          >
            <span className="sm:hidden">{day.short}</span>
            <span className="hidden sm:inline">{day.label}</span>
            <span
              aria-hidden
              className={cn(
                "absolute bottom-1 size-1 rounded-full",
                busy.has(day.id) ? (active ? "bg-primary-foreground/80" : "bg-sky/80") : "bg-transparent",
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
