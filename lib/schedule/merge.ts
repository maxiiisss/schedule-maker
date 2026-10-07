import type { Course } from "./types"

export interface MergeResult {
  courses: Course[]
  /** Blocks that were new and got added. */
  added: number
  /** Blocks skipped because the schedule already had the same one. */
  skipped: number
}

/** Same ramo, time, room and days: two blocks like this are duplicates. */
function signature(course: Pick<Course, "title" | "start" | "end" | "room" | "days">): string {
  return [
    course.title.trim().toLowerCase(),
    course.start,
    course.end,
    course.room.trim().toLowerCase(),
    [...course.days].sort().join(","),
  ].join("|")
}

let counter = 0
function createId(): string {
  counter += 1
  return `course-${Date.now()}-${counter}`
}

/**
 * Add `incoming` courses to `existing` without touching what is already there.
 *
 * Blocks identical to an existing one are skipped, so importing the same link
 * twice changes nothing. A ramo that already exists keeps its current color,
 * so its blocks stay visually grouped.
 */
export function mergeCourses(existing: Course[], incoming: Course[]): MergeResult {
  const seen = new Set(existing.map(signature))
  const colorByTitle = new Map<string, string>()
  for (const course of existing) {
    const key = course.title.trim().toLowerCase()
    if (!colorByTitle.has(key)) colorByTitle.set(key, course.colorId)
  }

  const courses = [...existing]
  let added = 0
  let skipped = 0

  for (const course of incoming) {
    const key = signature(course)
    if (seen.has(key)) {
      skipped += 1
      continue
    }
    seen.add(key)

    const title = course.title.trim().toLowerCase()
    courses.push({ ...course, id: createId(), colorId: colorByTitle.get(title) ?? course.colorId })
    if (!colorByTitle.has(title)) colorByTitle.set(title, course.colorId)
    added += 1
  }

  return { courses, added, skipped }
}
