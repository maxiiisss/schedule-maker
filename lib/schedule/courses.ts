import { durationMinutes } from "./time"
import type { Course } from "./types"

/** One scheduled block of a ramo: when and where it meets. */
export type CourseSlot = Pick<Course, "days" | "start" | "end" | "room">

/**
 * A logical "ramo" derived from existing blocks that share the same title.
 * Used when adding an additional time slot to a course already on the schedule.
 */
export interface CourseGroup {
  title: string
  colorId: string
  /** Lower-cased title, used as a stable key. */
  key: string
  /** Weekly minutes across every block and day of this ramo. */
  minutes: number
  /** Every block of this ramo, in the order they were added. */
  slots: CourseSlot[]
}

/**
 * Returns unique course groups (by title), preserving the color of the first
 * occurrence. Case-insensitive deduplication keeps the display title intact.
 */
export function getCourseGroups(courses: Course[]): CourseGroup[] {
  const seen = new Map<string, CourseGroup>()

  for (const course of courses) {
    const normalized = course.title.trim().toLowerCase()
    if (normalized.length === 0) continue

    const weekly = durationMinutes(course.start, course.end) * course.days.length
    const slot: CourseSlot = {
      days: course.days,
      start: course.start,
      end: course.end,
      room: course.room,
    }
    const group = seen.get(normalized)
    if (group) {
      group.minutes += weekly
      group.slots.push(slot)
      continue
    }

    seen.set(normalized, {
      title: course.title.trim(),
      colorId: course.colorId,
      key: normalized,
      minutes: weekly,
      slots: [slot],
    })
  }

  return Array.from(seen.values())
}

/** Resolve the color assigned to a course title, if any. */
export function colorForTitle(courses: Course[], title: string): string | undefined {
  const normalized = title.trim().toLowerCase()
  const match = courses.find((course) => course.title.trim().toLowerCase() === normalized)
  return match?.colorId
}
