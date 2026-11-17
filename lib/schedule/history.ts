import type { Person } from "./compare"
import type { Course } from "./types"

const STORAGE_KEY = "schedule:history:v1"

/** Fired on this page after the history changes (the `storage` event covers other tabs). */
export const HISTORY_CHANGED_EVENT = "schedule:history-changed"

/** How many past schedules are kept; the oldest are dropped first. */
export const MAX_HISTORY = 30

/** A schedule that was once compared, kept to bring it back without the link. */
export interface HistoryEntry {
  /** Id of the shared link it came from. Also the identity of the entry. */
  sourceId: string
  name: string
  /** Copy of the schedule from when it was added. */
  courses: Course[]
  /** When it was first compared (ms since epoch). */
  savedAt: number
}

/**
 * Pure: adds the people that came from a shared link to the history.
 *
 * Someone already in the history keeps their original date and only picks up their
 * current name (people can be renamed). New ones go to the front; the list is capped.
 */
export function mergePeopleIntoHistory(
  history: HistoryEntry[],
  people: Person[],
  now: number,
): HistoryEntry[] {
  let next = history
  for (const person of people) {
    if (!person.sourceId) continue
    const sourceId = person.sourceId
    const existing = next.find((entry) => entry.sourceId === sourceId)
    if (existing) {
      if (existing.name !== person.name) {
        next = next.map((entry) => (entry.sourceId === sourceId ? { ...entry, name: person.name } : entry))
      }
      continue
    }
    next = [{ sourceId, name: person.name, courses: person.courses, savedAt: now }, ...next]
  }
  // Unchanged input keeps its identity so callers can skip a pointless write.
  return next.length > MAX_HISTORY ? next.slice(0, MAX_HISTORY) : next
}

/** Pure: the history without one entry. */
export function withoutHistoryEntry(history: HistoryEntry[], sourceId: string): HistoryEntry[] {
  return history.filter((entry) => entry.sourceId !== sourceId)
}

/** Pure: entries that are not in the comparison right now. */
export function pastEntries(history: HistoryEntry[], people: Person[]): HistoryEntry[] {
  const current = new Set(people.map((person) => person.sourceId).filter(Boolean))
  return history.filter((entry) => !current.has(entry.sourceId))
}

export function readHistory(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? parsed.filter(isEntry) : []
  } catch {
    return []
  }
}

export function writeHistory(history: HistoryEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // storage unavailable: the history is a convenience and the app works without it
  }
  window.dispatchEvent(new Event(HISTORY_CHANGED_EVENT))
}

/** Records the people being compared. Called whenever the comparison is saved. */
export function rememberPeople(people: Person[]) {
  const current = readHistory()
  const next = mergePeopleIntoHistory(current, people, Date.now())
  if (next !== current) writeHistory(next)
}

export const HISTORY_STORAGE_KEY = STORAGE_KEY

function isEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") return false
  const entry = value as Partial<HistoryEntry>
  return (
    typeof entry.sourceId === "string" &&
    typeof entry.name === "string" &&
    typeof entry.savedAt === "number" &&
    Array.isArray(entry.courses)
  )
}
