"use client"

import { cn } from "@/lib/utils"
import { DAYS } from "@/lib/schedule/constants"
import { dateForDay } from "@/lib/schedule/days"
import type { DayId } from "@/lib/schedule/types"

/** One letter per day (Spanish calendars use X for miércoles). */
const INITIALS = ["L", "M", "X", "J", "V", "S", "D"]

interface WeekStripProps {
  selected: DayId
  today: DayId | null
  /** Today's date, used to print the day numbers. Null until mounted. */
  reference: Date | null
  /** Days that have at least one class. */
  busy: Set<DayId>
  onSelect: (day: DayId) => void
}

/**
 * Seven day buttons with weekday letter and date, like Google Calendar and
 * Calendar on iPhone. Built for thumbs: each target is a full column wide.
 */
export function WeekStrip({ selected, today, reference, busy, onSelect }: WeekStripProps) {
  return (
    <div role="group" aria-label="Día de la semana" className="grid grid-cols-7 px-2 pb-2 pt-1">
      {DAYS.map((day, index) => {
        const active = day.id === selected
        const isToday = day.id === today
        const date = reference ? dateForDay(day.id, reference).getDate() : null

        return (
          <button
            key={day.id}
            type="button"
            aria-pressed={active}
            aria-label={`${day.label}${date ? ` ${date}` : ""}${isToday ? ", hoy" : ""}${busy.has(day.id) ? ", con clases" : ""}`}
            onClick={() => onSelect(day.id)}
            className="flex flex-col items-center gap-1 rounded-lg py-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
          >
            <span className={cn("text-[11px] font-medium", isToday ? "text-sky" : "text-muted-foreground")}>
              {INITIALS[index]}
            </span>
            <span
              className={cn(
                "grid size-9 place-items-center rounded-full text-[17px] tabular-nums transition-colors",
                active
                  ? "bg-primary font-semibold text-primary-foreground"
                  : isToday
                    ? "font-semibold text-sky ring-1 ring-sky/60"
                    : "text-foreground",
              )}
            >
              {date ?? ""}
            </span>
            <span
              aria-hidden
              className={cn("size-1 rounded-full", busy.has(day.id) ? "bg-sky/80" : "bg-transparent")}
            />
          </button>
        )
      })}
    </div>
  )
}
