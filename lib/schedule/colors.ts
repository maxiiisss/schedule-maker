import { COLOR_BY_ID, COURSE_COLORS } from "./constants"
import type { Course, CourseColor } from "./types"

/** Resolve a color by id, falling back to the first palette entry. */
export function resolveColor(colorId: string): CourseColor {
  return COLOR_BY_ID[colorId] ?? COURSE_COLORS[0]
}

/**
 * Pick the next color for a new course: prefer the least-used color so
 * blocks stay visually distinct as the schedule fills up.
 */
export function pickNextColor(courses: Course[]): string {
  const usage = new Map<string, number>()
  for (const color of COURSE_COLORS) usage.set(color.id, 0)
  for (const course of courses) {
    usage.set(course.colorId, (usage.get(course.colorId) ?? 0) + 1)
  }

  let bestId = COURSE_COLORS[0].id
  let bestCount = Number.POSITIVE_INFINITY
  for (const color of COURSE_COLORS) {
    const count = usage.get(color.id) ?? 0
    if (count < bestCount) {
      bestCount = count
      bestId = color.id
    }
  }
  return bestId
}

/**
 * Presentation-ready style values derived from a color's base hex.
 * Translucent fill + solid bar, with text lightened toward white so it
 * stays readable on the dark grid.
 */
export function colorStyles(hex: string) {
  return {
    /** Soft translucent fill for the block body. */
    background: `${hex}2b`,
    /** Solid accent used for the left bar and marker dot. */
    accent: hex,
    /** Subtle border. */
    border: `${hex}40`,
    /** Readable text tone for titles and details. */
    text: `color-mix(in srgb, ${hex} 45%, white)`,
  }
}
