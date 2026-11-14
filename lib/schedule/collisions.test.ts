import { describe, expect, it } from "vitest"

import { coursesCollide, findConflicts, rangesOverlap } from "./collisions"
import type { Course } from "./types"

const course = (id: string, start: string, end: string, days: Course["days"]): Course => ({
  id,
  title: id,
  room: "",
  start,
  end,
  days,
  colorId: "blue",
})

describe("rangesOverlap", () => {
  it("detects partial and full overlaps", () => {
    expect(rangesOverlap("08:00", "10:00", "09:00", "11:00")).toBe(true)
    expect(rangesOverlap("08:00", "12:00", "09:00", "10:00")).toBe(true)
  })

  it("treats back-to-back classes as not overlapping", () => {
    expect(rangesOverlap("08:00", "10:00", "10:00", "12:00")).toBe(false)
  })

  it("is false for distant ranges", () => {
    expect(rangesOverlap("08:00", "09:00", "14:00", "15:00")).toBe(false)
  })
})

describe("coursesCollide", () => {
  it("needs a shared day", () => {
    const a = course("a", "08:00", "10:00", ["MON"])
    const b = course("b", "09:00", "11:00", ["TUE"])
    expect(coursesCollide(a, b)).toBe(false)
    expect(coursesCollide(a, { ...b, days: ["TUE", "MON"] })).toBe(true)
  })
})

describe("findConflicts", () => {
  const courses = [
    course("a", "08:00", "10:00", ["MON"]),
    course("b", "09:00", "11:00", ["MON", "WED"]),
    course("c", "14:00", "15:00", ["MON"]),
  ]

  it("returns every colliding course", () => {
    const found = findConflicts({ start: "09:30", end: "10:30", days: ["MON"] }, courses)
    expect(found.map((c) => c.id)).toEqual(["a", "b"])
  })

  it("ignores the course being edited", () => {
    const found = findConflicts({ start: "09:30", end: "10:30", days: ["MON"] }, courses, "a")
    expect(found.map((c) => c.id)).toEqual(["b"])
  })

  it("returns nothing when the slot is free", () => {
    expect(findConflicts({ start: "12:00", end: "13:00", days: ["MON"] }, courses)).toEqual([])
  })
})
