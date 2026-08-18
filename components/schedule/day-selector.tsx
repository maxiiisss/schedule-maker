"use client"

import { cn } from "@/lib/utils"
import { DAYS } from "@/lib/schedule/constants"
import type { DayId } from "@/lib/schedule/types"

interface DaySelectorProps {
  value: DayId[]
  onChange: (days: DayId[]) => void
  invalid?: boolean
}

/** Multi-select day toggles (Mon–Sun). Presentation only. */
export function DaySelector({ value, onChange, invalid }: DaySelectorProps) {
  const toggle = (day: DayId) => {
    onChange(value.includes(day) ? value.filter((d) => d !== day) : [...value, day])
  }

  return (
    <div
      role="group"
      aria-label="Días de la semana"
      className={cn(
        "flex flex-wrap gap-1.5 rounded-lg",
        invalid && "outline outline-2 outline-offset-4 outline-destructive/40",
      )}
    >
      {DAYS.map((day) => {
        const active = value.includes(day.id)
        return (
          <button
            key={day.id}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(day.id)}
            className={cn(
              "min-w-11 rounded-lg border px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {day.short}
          </button>
        )
      })}
    </div>
  )
}
