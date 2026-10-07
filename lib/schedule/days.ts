import { DAYS } from "./constants"
import type { Course, Day, DayId } from "./types"

/** Map a JS Date to our Monday-first day id. */
export function dayIdFromDate(date: Date): DayId {
  return DAYS[(date.getDay() + 6) % 7].id
}

/** True when any course is placed on a Saturday or Sunday. */
export function hasWeekendCourses(courses: Course[]): boolean {
  return courses.some((course) =>
    course.days.some((id) => DAYS.find((day) => day.id === id)?.weekend),
  )
}

/**
 * Days shown in the week view: Monday–Friday, plus the weekend when the user
 * asked for it or a course already lives there.
 */
export function weekViewDays(courses: Course[], includeWeekend: boolean): Day[] {
  const showWeekend = includeWeekend || hasWeekendCourses(courses)
  return DAYS.filter((day) => showWeekend || !day.weekend)
}
