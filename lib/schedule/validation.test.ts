import { describe, expect, it } from "vitest"

import { errorFor, validateCourseDraft, validateCourseDrafts } from "./validation"
import type { CourseDraft } from "./types"

const draft = (over: Partial<CourseDraft> = {}): CourseDraft => ({
  title: "Cálculo",
  room: "",
  start: "08:30",
  end: "10:00",
  days: ["MON"],
  colorId: "blue",
  ...over,
})

describe("validateCourseDraft", () => {
  it("accepts a complete draft", () => {
    expect(validateCourseDraft(draft())).toEqual([])
  })

  it("requires a title, a day and times", () => {
    const errors = validateCourseDraft(draft({ title: "  ", days: [], start: "", end: "" }))
    expect(errors.map((e) => e.field).sort()).toEqual(["days", "start", "title"])
  })

  it("rejects malformed times", () => {
    expect(errorFor(validateCourseDraft(draft({ start: "8.30" })), "start")).toMatch(/Formato/)
    expect(errorFor(validateCourseDraft(draft({ end: "25:00" })), "end")).toMatch(/Formato/)
  })

  it("requires the end to be after the start", () => {
    expect(errorFor(validateCourseDraft(draft({ start: "10:00", end: "10:00" })), "end")).toMatch(/posterior/)
    expect(errorFor(validateCourseDraft(draft({ start: "11:00", end: "10:00" })), "end")).toMatch(/posterior/)
  })

  it("accepts classes at any hour", () => {
    expect(validateCourseDraft(draft({ start: "00:15", end: "23:45" }))).toEqual([])
  })
})

describe("validateCourseDrafts", () => {
  it("needs at least one slot", () => {
    expect(validateCourseDrafts([])).toEqual([{ field: "form", message: "Agrega al menos un horario." }])
  })

  it("accepts several valid slots", () => {
    expect(
      validateCourseDrafts([draft(), draft({ days: ["WED"], start: "15:00", end: "17:00" })]),
    ).toEqual([])
  })

  it("tags each issue with the slot it belongs to", () => {
    const errors = validateCourseDrafts([draft(), draft({ days: [] }), draft({ end: "07:00" })])
    expect(errorFor(errors, "days", 1)).toBeDefined()
    expect(errorFor(errors, "end", 2)).toBeDefined()
    expect(errorFor(errors, "days", 0)).toBeUndefined()
  })

  it("reports a missing title once", () => {
    const errors = validateCourseDrafts([draft({ title: "" }), draft({ title: "" })])
    expect(errors.filter((e) => e.field === "title")).toHaveLength(1)
    expect(errorFor(errors, "title")).toBeDefined()
  })
})
