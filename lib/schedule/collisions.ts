import { timeToMinutes } from "./time"
import type { Course, CourseDraft } from "./types"

/** Two [start, end) ranges overlap when each starts before the other ends. */
export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return (
    timeToMinutes(aStart) < timeToMinutes(bEnd) &&
    timeToMinutes(bStart) < timeToMinutes(aEnd)
  )
}

/** Two courses collide when they share a day and overlap in time. */
export function coursesCollide(
  a: Pick<Course, "start" | "end" | "days">,
  b: Pick<Course, "start" | "end" | "days">,
): boolean {
  const sharedDay = a.days.some((day) => b.days.includes(day))
  if (!sharedDay) return false
  return rangesOverlap(a.start, a.end, b.start, b.end)
}

/**
 * Find every existing course that collides with the given draft.
 * `ignoreId` lets us exclude the course currently being edited.
 */
export function findConflicts(
  draft: Pick<CourseDraft, "start" | "end" | "days">,
  courses: Course[],
  ignoreId?: string,
): Course[] {
  return courses.filter(
    (course) => course.id !== ignoreId && coursesCollide(draft, course),
  )
}
