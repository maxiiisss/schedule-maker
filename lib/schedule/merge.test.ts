import { describe, expect, it } from "vitest"

import { mergeCourses } from "./merge"
import type { Course } from "./types"

const course = (over: Partial<Course> = {}): Course => ({
  id: "x",
  title: "Cálculo",
  room: "B-204",
  start: "08:30",
  end: "10:00",
  days: ["MON", "WED"],
  colorId: "blue",
  ...over,
})

describe("mergeCourses", () => {
  it("adds new blocks and keeps the existing ones untouched", () => {
    const existing = [course({ id: "a" })]
    const result = mergeCourses(existing, [course({ title: "Física", start: "11:00", end: "12:30" })])
    expect(result.added).toBe(1)
    expect(result.skipped).toBe(0)
    expect(result.courses).toHaveLength(2)
    expect(result.courses[0]).toBe(existing[0])
  })

  it("skips blocks identical to an existing one, ignoring case, spaces and day order", () => {
    const existing = [course({ id: "a" })]
    const result = mergeCourses(existing, [course({ title: "  cálculo ", room: "b-204", days: ["WED", "MON"] })])
    expect(result.added).toBe(0)
    expect(result.skipped).toBe(1)
    expect(result.courses).toHaveLength(1)
  })

  it("is idempotent: importing the same data twice adds nothing the second time", () => {
    const incoming = [course({ title: "Física" }), course({ title: "Química", start: "14:00", end: "15:30" })]
    const first = mergeCourses([], incoming)
    const second = mergeCourses(first.courses, incoming)
    expect(first.added).toBe(2)
    expect(second.added).toBe(0)
    expect(second.skipped).toBe(2)
  })

  it("keeps the color of a ramo that already exists", () => {
    const existing = [course({ id: "a", colorId: "emerald" })]
    const result = mergeCourses(existing, [course({ colorId: "rose", start: "15:00", end: "16:00" })])
    expect(result.courses[1].colorId).toBe("emerald")
  })

  it("gives imported blocks fresh ids", () => {
    const result = mergeCourses([], [course({ id: "same" }), course({ id: "same", start: "15:00", end: "16:00" })])
    const ids = result.courses.map((c) => c.id)
    expect(new Set(ids).size).toBe(2)
    expect(ids).not.toContain("same")
  })

  it("dedupes repeated blocks inside the incoming list", () => {
    const result = mergeCourses([], [course(), course()])
    expect(result.added).toBe(1)
    expect(result.skipped).toBe(1)
  })
})
