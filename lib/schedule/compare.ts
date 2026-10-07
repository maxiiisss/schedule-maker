import { DAYS, END_HOUR, START_HOUR } from "./constants"
import { timeToMinutes } from "./time"
import type { Course, DayId } from "./types"

/** Another person's schedule, kept on this device to compare with the user's own. */
export interface Person {
  id: string
  name: string
  /** Color id from the course palette; identifies the person in the grid. */
  colorId: string
  courses: Course[]
  /** Share id it came from, to avoid adding the same link twice. */
  sourceId?: string
  /** Hidden people stay in the list but not in the grid. */
  visible: boolean
}

/** A course ready to draw: tagged with whose it is and whether it can be edited. */
export type GridCourse = Course & { owner?: string; readOnly?: boolean }

export const MAX_PEOPLE = 5
export const OWN_LABEL = "Yo"

/** The user is first; others take the next free color in this order. */
export const PERSON_COLOR_IDS = ["blue", "orange", "emerald", "violet", "rose", "teal", "amber"]

export function nextPersonColor(people: Person[]): string {
  const used = new Set(people.map((person) => person.colorId))
  return PERSON_COLOR_IDS.slice(1).find((id) => !used.has(id)) ?? PERSON_COLOR_IDS[1]
}

/**
 * Merge the user's courses with the visible people's into one list for the grid.
 * Blocks are colored by person (not by ramo) so overlaps read at a glance.
 */
export function buildComparison(mine: Course[], people: Person[]): GridCourse[] {
  const own: GridCourse[] = mine.map((course) => ({
    ...course,
    colorId: PERSON_COLOR_IDS[0],
    owner: OWN_LABEL,
  }))

  const others = people
    .filter((person) => person.visible)
    .flatMap((person): GridCourse[] =>
      person.courses.map((course) => ({
        ...course,
        id: `${person.id}:${course.id}`,
        colorId: person.colorId,
        owner: person.name,
        readOnly: true,
      })),
    )

  return [...own, ...others]
}

/** A stretch of a day (minutes since midnight) when nobody has class. */
export interface FreeSlot {
  day: DayId
  start: number
  end: number
}

/**
 * Time windows, inside the grid hours, when none of the given schedules has a
 * class. Windows shorter than `minMinutes` are dropped.
 */
export function commonFreeSlots(
  schedules: Course[][],
  days: DayId[],
  minMinutes = 30,
): FreeSlot[] {
  const from = START_HOUR * 60
  const to = END_HOUR * 60
  const slots: FreeSlot[] = []

  for (const day of days) {
    const busy = schedules
      .flat()
      .filter((course) => course.days.includes(day))
      .map((course) => [timeToMinutes(course.start), timeToMinutes(course.end)] as const)
      .sort((a, b) => a[0] - b[0])

    let cursor = from
    for (const [start, end] of busy) {
      if (start - cursor >= minMinutes) slots.push({ day, start: cursor, end: Math.min(start, to) })
      cursor = Math.max(cursor, end)
    }
    if (to - cursor >= minMinutes) slots.push({ day, start: cursor, end: to })
  }

  return slots.filter((slot) => slot.end - slot.start >= minMinutes && slot.start < to && slot.end > from)
}

/** The longest shared gap; ties go to the earliest day and time. */
export function bestFreeSlot(slots: FreeSlot[]): FreeSlot | null {
  const order = (day: DayId) => DAYS.findIndex((item) => item.id === day)
  let best: FreeSlot | null = null
  for (const slot of slots) {
    if (!best) {
      best = slot
      continue
    }
    const length = slot.end - slot.start
    const bestLength = best.end - best.start
    if (
      length > bestLength ||
      (length === bestLength && (order(slot.day) < order(best.day) || (slot.day === best.day && slot.start < best.start)))
    ) {
      best = slot
    }
  }
  return best
}

/** "11:45" from minutes since midnight. */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}
