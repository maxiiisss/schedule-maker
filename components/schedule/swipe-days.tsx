"use client"

import { useRef } from "react"

import { cn } from "@/lib/utils"
import { DAYS } from "@/lib/schedule/constants"
import type { DayId } from "@/lib/schedule/types"

/** Minimum horizontal travel (px) for a swipe, and how much more horizontal than vertical it must be. */
const MIN_DISTANCE = 56
const DOMINANCE = 1.4
const MAX_DURATION_MS = 700

interface SwipeDaysProps {
  /** Day currently shown. */
  day: DayId
  onChange: (day: DayId) => void
  /** Off in the week view, where the grid scrolls sideways on its own. */
  enabled: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Lets the single-day view move between days with a horizontal swipe: left for the next day,
 * right for the previous one. Vertical scrolling is untouched (`touch-pan-y`), and the day
 * slides in from the side it came from.
 */
export function SwipeDays({ day, onChange, enabled, className, children }: SwipeDaysProps) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null)
  const previous = useRef<DayId>(day)
  const direction = useRef<"next" | "prev">("next")

  const index = DAYS.findIndex((item) => item.id === day)
  const before = DAYS.findIndex((item) => item.id === previous.current)
  if (previous.current !== day) {
    direction.current = index > before ? "next" : "prev"
    previous.current = day
  }

  const onTouchStart = (event: React.TouchEvent) => {
    if (!enabled || event.touches.length !== 1) {
      start.current = null
      return
    }
    const touch = event.touches[0]
    start.current = { x: touch.clientX, y: touch.clientY, t: Date.now() }
  }

  const onTouchEnd = (event: React.TouchEvent) => {
    const from = start.current
    start.current = null
    if (!enabled || !from) return

    const touch = event.changedTouches[0]
    const dx = touch.clientX - from.x
    const dy = touch.clientY - from.y
    if (Date.now() - from.t > MAX_DURATION_MS) return
    if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * DOMINANCE) return

    const target = DAYS[index + (dx < 0 ? 1 : -1)]
    if (target) onChange(target.id)
  }

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => (start.current = null)}
      className={cn(enabled && "touch-pan-y", className)}
    >
      <div
        key={enabled ? day : "week"}
        className={cn(
          enabled &&
            cn(
              "animate-in fade-in-0 duration-200 motion-safe:ease-out",
              direction.current === "next"
                ? "motion-safe:slide-in-from-right-4"
                : "motion-safe:slide-in-from-left-4",
            ),
        )}
      >
        {children}
      </div>
    </div>
  )
}
