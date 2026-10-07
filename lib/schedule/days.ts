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

/** Date of `dayId` in the Monday-first week that contains `reference`. */
export function dateForDay(dayId: DayId, reference: Date): Date {
  const index = DAYS.findIndex((day) => day.id === dayId)
  const monday = new Date(reference)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((reference.getDay() + 6) % 7))
  monday.setDate(monday.getDate() + index)
  return monday
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "Octubre 2026" */
export function formatMonthYear(date: Date): string {
  return capitalize(date.toLocaleDateString("es", { month: "long", year: "numeric" }))
}

/** "Miércoles 7 de octubre" */
export function formatDayTitle(date: Date): string {
  return capitalize(date.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" }))
}
