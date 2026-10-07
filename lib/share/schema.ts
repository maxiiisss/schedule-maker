import { COLOR_BY_ID, DAYS } from "@/lib/schedule/constants"
import type { Course, DayId } from "@/lib/schedule/types"
import { validateCourseDraft } from "@/lib/schedule/validation"

/** Bump when the stored shape changes so old links can still be read. */
export const SHARE_VERSION = 1

export const MAX_COURSES = 60
export const MAX_TEXT_LENGTH = 80
export const MAX_NAME_LENGTH = 40
/** Largest request body accepted by the share endpoint, in characters. */
export const MAX_BODY_LENGTH = 32_000

const DAY_IDS = new Set<string>(DAYS.map((day) => day.id))

/** What a share link contains: a display name and the courses, nothing else. */
export interface SharedSchedule {
  v: typeof SHARE_VERSION
  name: string
  courses: Course[]
}

export type ParseResult =
  | { ok: true; data: SharedSchedule }
  | { ok: false; error: string }

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null
  const text = value.trim()
  return text.length <= max ? text : null
}

/**
 * Validate and normalise an untrusted payload.
 *
 * Reuses the same rules as the course form, caps sizes, and rebuilds every
 * course from known fields so nothing unexpected is ever stored or rendered.
 */
export function parseSharedSchedule(input: unknown): ParseResult {
  if (!input || typeof input !== "object") return { ok: false, error: "Invalid payload." }
  const raw = input as { name?: unknown; courses?: unknown }

  const name = raw.name === undefined ? "" : cleanText(raw.name, MAX_NAME_LENGTH)
  if (name === null) return { ok: false, error: "Invalid name." }

  if (!Array.isArray(raw.courses) || raw.courses.length === 0) {
    return { ok: false, error: "The schedule has no courses." }
  }
  if (raw.courses.length > MAX_COURSES) {
    return { ok: false, error: `A schedule can have at most ${MAX_COURSES} courses.` }
  }

  const courses: Course[] = []
  for (const item of raw.courses) {
    if (!item || typeof item !== "object") return { ok: false, error: "Invalid course." }
    const course = item as Record<string, unknown>

    const title = cleanText(course.title, MAX_TEXT_LENGTH)
    const room = cleanText(course.room ?? "", MAX_TEXT_LENGTH)
    const start = typeof course.start === "string" ? course.start : ""
    const end = typeof course.end === "string" ? course.end : ""
    const colorId = typeof course.colorId === "string" ? course.colorId : ""
    const days = Array.isArray(course.days) ? course.days : []

    if (title === null || room === null) return { ok: false, error: "Invalid course text." }
    if (!days.every((day) => typeof day === "string" && DAY_IDS.has(day))) {
      return { ok: false, error: "Invalid course days." }
    }

    const draft = { title, room, start, end, days: [...new Set(days)] as DayId[], colorId }
    if (validateCourseDraft(draft).length > 0) return { ok: false, error: "Invalid course." }

    courses.push({
      id: `c${courses.length}`,
      ...draft,
      colorId: COLOR_BY_ID[colorId] ? colorId : "blue",
    })
  }

  return { ok: true, data: { v: SHARE_VERSION, name, courses } }
}
