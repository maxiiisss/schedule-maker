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
        "grid grid-cols-7 gap-1.5 rounded-md",
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
              "h-9 rounded-md border px-0 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
              active
                ? "border-transparent bg-primary font-medium text-primary-foreground"
                : "border-input bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {day.short}
          </button>
        )
      })}
    </div>
  )
}
