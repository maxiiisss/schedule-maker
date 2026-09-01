"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { pickNextColor } from "@/lib/schedule/colors"
import { DAYS, DEFAULT_DAY_IDS } from "@/lib/schedule/constants"
import type { Course, CourseDraft, Day, ValidationError } from "@/lib/schedule/types"
import { validateCourseDraft } from "@/lib/schedule/validation"

/** Result of a mutation attempt. */
export interface MutationResult {
  ok: boolean
  errors: ValidationError[]
}

let idCounter = 0
function createId(): string {
  idCounter += 1
  return `course-${Date.now()}-${idCounter}`
}

/**
 * Owns the schedule's in-memory state and exposes intent-based actions.
 *
 * The component tree only talks to this hook; all rules are delegated to
 * the pure domain modules. Swapping the `useState` store for a database or
 * API layer later would not require touching the presentation components.
 */
export function useSchedule(initial: Course[] = []) {
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('schedule:v1') : null
      if (!raw) return initial
      const parsed = JSON.parse(raw) as Course[]
      return Array.isArray(parsed) ? parsed : initial
    } catch (e) {
      return initial
    }
  })

  const addCourse = useCallback(
    (draft: CourseDraft): MutationResult => {
      const errors = validateCourseDraft(draft)
      if (errors.length > 0) return { ok: false, errors }

      const course: Course = {
        id: createId(),
        title: draft.title.trim(),
        room: draft.room.trim(),
        start: draft.start,
        end: draft.end,
        days: draft.days,
        colorId: draft.colorId || pickNextColor(courses),
      }
      setCourses((prev) => [...prev, course])
      return { ok: true, errors: [] }
    },
    [courses],
  )

  const updateCourse = useCallback(
    (id: string, draft: CourseDraft): MutationResult => {
      const errors = validateCourseDraft(draft)
      if (errors.length > 0) return { ok: false, errors }

      setCourses((prev) =>
        prev.map((course) =>
          course.id === id
            ? {
                ...course,
                title: draft.title.trim(),
                room: draft.room.trim(),
                start: draft.start,
                end: draft.end,
                days: draft.days,
                colorId: draft.colorId,
              }
            : course,
        ),
      )
      return { ok: true, errors: [] }
    },
    [courses],
  )

  const removeCourse = useCallback((id: string) => {
    setCourses((prev) => prev.filter((course) => course.id !== id))
  }, [])

  const clearAll = useCallback(() => setCourses([]), [])

  const restoreCourses = useCallback((nextCourses: Course[]) => {
    setCourses(nextCourses)
  }, [])

  /** Suggested color for the next new course. */
  const nextColor = useMemo(() => pickNextColor(courses), [courses])

  /**
   * Days that should be visible: the weekday defaults plus any weekend day
   * that currently holds a course. The grid grows/shrinks with the data.
   */
  const visibleDays = useMemo<Day[]>(() => {
    const active = new Set<string>(DEFAULT_DAY_IDS)
    for (const course of courses) {
      for (const day of course.days) active.add(day)
    }
    return DAYS.filter((day) => active.has(day.id))
  }, [courses])

  // Persist schedule to localStorage whenever it changes.
  useEffect(() => {
    try {
      const data = JSON.stringify(courses)
      window.localStorage.setItem('schedule:v1', data)
    } catch (e) {
      // ignore storage errors (e.g., quota) — keep app usable
    }
  }, [courses])

  return {
    courses,
    visibleDays,
    nextColor,
    addCourse,
    updateCourse,
    removeCourse,
    clearAll,
    restoreCourses,
  }
}
