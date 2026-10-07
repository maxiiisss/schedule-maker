"use client"

import { useCallback, useEffect, useState } from "react"

import { dayIdFromDate } from "@/lib/schedule/days"
import type { DayId, ViewMode } from "@/lib/schedule/types"

const STORAGE_KEY = "schedule:view:v1"

interface StoredView {
  mode: ViewMode
  includeWeekend: boolean
}

/**
 * Presentation state for the grid: week vs. single-day view, whether the
 * week view includes the weekend, and which day the day view shows.
 *
 * Starts from a stable default, then restores the saved preference on mount.
 * With no saved preference, phones open on the day view and today.
 */
export function useViewState() {
  const [mode, setModeState] = useState<ViewMode>("week")
  const [includeWeekend, setIncludeWeekendState] = useState(false)
  const [selectedDay, setSelectedDay] = useState<DayId>("MON")

  useEffect(() => {
    setSelectedDay(dayIdFromDate(new Date()))
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const stored = JSON.parse(raw) as Partial<StoredView>
        if (stored.mode === "day" || stored.mode === "week") setModeState(stored.mode)
        if (typeof stored.includeWeekend === "boolean") setIncludeWeekendState(stored.includeWeekend)
        return
      }
    } catch {
      // ignore unreadable storage
    }
    if (window.matchMedia("(max-width: 639px)").matches) setModeState("day")
  }, [])

  const save = useCallback((next: StoredView) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore storage errors
    }
  }, [])

  const setMode = useCallback(
    (next: ViewMode) => {
      setModeState(next)
      save({ mode: next, includeWeekend })
    },
    [includeWeekend, save],
  )

  const setIncludeWeekend = useCallback(
    (next: boolean) => {
      setIncludeWeekendState(next)
      save({ mode, includeWeekend: next })
    },
    [mode, save],
  )

  return { mode, setMode, includeWeekend, setIncludeWeekend, selectedDay, setSelectedDay }
}
