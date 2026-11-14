import { describe, expect, it } from "vitest"

import {
  bestFreeSlot,
  buildComparison,
  commonFreeSlots,
  formatMinutes,
  nextPersonColor,
  OWN_LABEL,
  type Person,
} from "./compare"
import type { Course } from "./types"

const course = (id: string, start: string, end: string, days: Course["days"]): Course => ({
  id,
  title: id,
  room: "",
  start,
  end,
  days,
  colorId: "sky",
})

const person = (over: Partial<Person> = {}): Person => ({
  id: "p1",
  name: "Camila",
  colorId: "orange",
  courses: [course("q", "09:00", "11:00", ["MON"])],
  visible: true,
  ...over,
})

describe("buildComparison", () => {
  it("tags the user's blocks and recolors them", () => {
    const [mine] = buildComparison([course("a", "08:00", "09:00", ["MON"])], [])
    expect(mine.owner).toBe(OWN_LABEL)
    expect(mine.colorId).toBe("blue")
    expect(mine.readOnly).toBeUndefined()
  })

  it("adds visible people as read-only blocks with namespaced ids", () => {
    const result = buildComparison([], [person()])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ id: "p1:q", owner: "Camila", colorId: "orange", readOnly: true })
  })

  it("leaves hidden people out", () => {
    expect(buildComparison([], [person({ visible: false })])).toEqual([])
  })
})

describe("nextPersonColor", () => {
  it("picks the first color nobody uses, skipping the user's", () => {
    expect(nextPersonColor([])).toBe("orange")
    expect(nextPersonColor([person({ colorId: "orange" })])).toBe("emerald")
  })
})

describe("commonFreeSlots", () => {
  it("finds the gaps between classes inside the default window", () => {
    const busy = [[course("a", "09:00", "10:00", ["MON"]), course("b", "12:00", "13:00", ["MON"])]]
    const slots = commonFreeSlots(busy, ["MON"])
    expect(slots).toEqual([
      { day: "MON", start: 8 * 60, end: 9 * 60 },
      { day: "MON", start: 10 * 60, end: 12 * 60 },
      { day: "MON", start: 13 * 60, end: 22 * 60 },
    ])
  })

  it("combines several schedules", () => {
    const slots = commonFreeSlots(
      [[course("a", "08:00", "12:00", ["TUE"])], [course("b", "10:00", "14:00", ["TUE"])]],
      ["TUE"],
    )
    expect(slots).toEqual([{ day: "TUE", start: 14 * 60, end: 22 * 60 }])
  })

  it("drops windows shorter than the minimum", () => {
    const slots = commonFreeSlots(
      [[course("a", "08:00", "09:00", ["MON"]), course("b", "09:15", "22:00", ["MON"])]],
      ["MON"],
    )
    expect(slots).toEqual([])
  })

  it("treats a day with no classes as free for the whole window", () => {
    const slots = commonFreeSlots([[course("a", "08:00", "09:00", ["MON"])]], ["FRI"])
    expect(slots).toEqual([{ day: "FRI", start: 8 * 60, end: 22 * 60 }])
  })
})

describe("bestFreeSlot", () => {
  it("returns null for no slots", () => {
    expect(bestFreeSlot([])).toBeNull()
  })

  it("prefers the longest gap", () => {
    const best = bestFreeSlot([
      { day: "MON", start: 480, end: 540 },
      { day: "TUE", start: 600, end: 780 },
    ])
    expect(best).toEqual({ day: "TUE", start: 600, end: 780 })
  })

  it("breaks ties with the earliest day, then the earliest time", () => {
    expect(
      bestFreeSlot([
        { day: "WED", start: 480, end: 540 },
        { day: "MON", start: 600, end: 660 },
      ]),
    ).toEqual({ day: "MON", start: 600, end: 660 })
    expect(
      bestFreeSlot([
        { day: "MON", start: 600, end: 660 },
        { day: "MON", start: 480, end: 540 },
      ]),
    ).toEqual({ day: "MON", start: 480, end: 540 })
  })
})

describe("formatMinutes", () => {
  it("pads hours and minutes", () => {
    expect(formatMinutes(9 * 60 + 5)).toBe("09:05")
  })
})
