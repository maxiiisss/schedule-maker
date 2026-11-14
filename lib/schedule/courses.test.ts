import { describe, expect, it } from "vitest"

import { colorForTitle, getCourseGroups } from "./courses"
import type { Course } from "./types"

const course = (over: Partial<Course>): Course => ({
  id: "x",
  title: "Cálculo",
  room: "",
  start: "08:00",
  end: "09:30",
  days: ["MON"],
  colorId: "blue",
  ...over,
})

describe("getCourseGroups", () => {
  it("groups blocks by title, ignoring case and spaces, keeping the first color", () => {
    const groups = getCourseGroups([
      course({ id: "a", title: "Cálculo", colorId: "blue" }),
      course({ id: "b", title: " cálculo ", colorId: "rose", days: ["WED"], start: "15:00", end: "17:00" }),
      course({ id: "c", title: "Física", colorId: "sky" }),
    ])
    expect(groups.map((g) => g.title)).toEqual(["Cálculo", "Física"])
    expect(groups[0].colorId).toBe("blue")
    expect(groups[0].slots).toHaveLength(2)
  })

  it("adds up the weekly minutes across blocks and days", () => {
    const [group] = getCourseGroups([
      course({ days: ["MON", "WED"] }), // 90 min x 2
      course({ days: ["FRI"], start: "10:00", end: "12:00" }), // 120 min
    ])
    expect(group.minutes).toBe(300)
  })

  it("skips blocks without a title", () => {
    expect(getCourseGroups([course({ title: "   " })])).toEqual([])
  })
})

describe("colorForTitle", () => {
  it("finds the color of a ramo case-insensitively", () => {
    expect(colorForTitle([course({ colorId: "teal" })], "CÁLCULO")).toBe("teal")
  })

  it("returns undefined for an unknown ramo", () => {
    expect(colorForTitle([course({})], "Química")).toBeUndefined()
  })
})
