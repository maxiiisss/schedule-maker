import { MAX_PEOPLE, nextPersonColor, type Person } from "./compare"
import type { Course } from "./types"

const STORAGE_KEY = "schedule:people:v1"

export type AddPersonResult =
  | { ok: true; people: Person[]; person: Person }
  | { ok: false; reason: "limit" | "duplicate" }

export function readPeople(): Person[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isPerson)
  } catch {
    return []
  }
}

export function writePeople(people: Person[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(people))
  } catch {
    // storage unavailable: comparison still works until the page is closed
  }
}

let counter = 0
function createId(): string {
  counter += 1
  return `p-${Date.now().toString(36)}-${counter}`
}

/** Pure: returns the next list, or why the person could not be added. */
export function withPerson(
  people: Person[],
  input: { name: string; courses: Course[]; sourceId?: string },
): AddPersonResult {
  if (people.length >= MAX_PEOPLE) return { ok: false, reason: "limit" }
  if (input.sourceId && people.some((person) => person.sourceId === input.sourceId)) {
    return { ok: false, reason: "duplicate" }
  }

  const person: Person = {
    id: createId(),
    name: input.name.trim() || `Horario ${people.length + 2}`,
    colorId: nextPersonColor(people),
    courses: input.courses,
    sourceId: input.sourceId,
    visible: true,
  }
  return { ok: true, people: [...people, person], person }
}

function isPerson(value: unknown): value is Person {
  if (!value || typeof value !== "object") return false
  const person = value as Partial<Person>
  return (
    typeof person.id === "string" &&
    typeof person.name === "string" &&
    typeof person.colorId === "string" &&
    typeof person.visible === "boolean" &&
    Array.isArray(person.courses)
  )
}
