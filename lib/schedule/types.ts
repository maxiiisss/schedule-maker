/**
 * Domain types for the schedule maker.
 *
 * This module is framework-agnostic: it describes the shape of the data
 * and contains no React or presentation concerns. Keeping it isolated makes
 * it trivial to later persist these entities in a database/API.
 */

/** Stable identifiers for the days of the week. */
export type DayId = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"

/** A day descriptor used to render axes and labels. */
export interface Day {
  id: DayId
  /** Full label, e.g. "Lunes". */
  label: string
  /** Short label used on compact/mobile layouts, e.g. "Lun". */
  short: string
  /** Whether the day belongs to the weekend (Sat/Sun). */
  weekend: boolean
}

/** A course color option (theme-agnostic, works in light & dark). */
export interface CourseColor {
  id: string
  label: string
  /** Base hex used to derive background, border and marker. */
  hex: string
}

/**
 * A single course/subject placed on the schedule.
 *
 * Times are stored as "HH:mm" strings and always refer to the same day.
 * A course can occur on multiple days at the same time range.
 */
export interface Course {
  id: string
  title: string
  room: string
  /** "HH:mm", inclusive start. */
  start: string
  /** "HH:mm", exclusive end. */
  end: string
  /** Days on which this course is taught. */
  days: DayId[]
  /** Id of the assigned color. */
  colorId: string
}

/** Shape of the form used to create/edit a course. */
export interface CourseDraft {
  title: string
  room: string
  start: string
  end: string
  days: DayId[]
  colorId: string
}

/** A validation issue keyed by the field it belongs to (or "form"). */
export interface ValidationError {
  field: keyof CourseDraft | "form"
  message: string
}
