import { describe, expect, it } from "vitest"

import {
  DEFAULT_HOUR_RANGE,
  durationMinutes,
  formatDuration,
  formatHoursShort,
  hourRangeFor,
  minutesToTime,
  normalizeTimeInput,
  timeToMinutes,
} from "./time"

describe("timeToMinutes / minutesToTime", () => {
  it("converts both ways", () => {
    expect(timeToMinutes("08:30")).toBe(510)
    expect(minutesToTime(510)).toBe("08:30")
    expect(minutesToTime(timeToMinutes("23:59"))).toBe("23:59")
  })

  it("clamps to the day", () => {
    expect(minutesToTime(-5)).toBe("00:00")
    expect(minutesToTime(24 * 60 + 30)).toBe("24:00")
  })

  it("measures durations", () => {
    expect(durationMinutes("11:30", "13:00")).toBe(90)
  })
})

describe("normalizeTimeInput", () => {
  it.each([
    ["1030", "10:30"],
    ["930", "09:30"],
    ["9", "09:00"],
    ["10", "10:00"],
    ["10.30", "10:30"],
    ["10,30", "10:30"],
    ["9:05", "09:05"],
    ["13h45", "13:45"],
    ["  8:00 ", "08:00"],
  ])("reads %s as %s", (raw, expected) => {
    expect(normalizeTimeInput(raw)).toBe(expected)
  })

  it.each(["2460", "25:00", "12:75", "abc", "1:2"])("leaves %s unchanged for validation to report", (raw) => {
    expect(normalizeTimeInput(raw)).toBe(raw)
  })

  it("keeps an empty field empty", () => {
    expect(normalizeTimeInput("")).toBe("")
    expect(normalizeTimeInput("   ")).toBe("")
  })
})

describe("hourRangeFor", () => {
  it("uses the default window with no courses", () => {
    expect(hourRangeFor([])).toEqual(DEFAULT_HOUR_RANGE)
  })

  it("keeps the default window when every course fits in it", () => {
    expect(hourRangeFor([{ start: "09:00", end: "10:30" }])).toEqual(DEFAULT_HOUR_RANGE)
  })

  it("widens to include early and late classes, rounding outwards", () => {
    expect(hourRangeFor([{ start: "06:30", end: "08:00" }, { start: "21:00", end: "23:15" }])).toEqual({
      start: 6,
      end: 24,
    })
  })

  it("never leaves the 0-24 range", () => {
    expect(hourRangeFor([{ start: "00:00", end: "24:00" }])).toEqual({ start: 0, end: 24 })
  })
})

describe("duration labels", () => {
  it("formats readable durations", () => {
    expect(formatDuration(90)).toBe("1 h 30 min")
    expect(formatDuration(180)).toBe("3 h")
    expect(formatDuration(45)).toBe("45 min")
  })

  it("formats compact hours with a decimal comma", () => {
    expect(formatHoursShort(90)).toBe("1,5 h")
    expect(formatHoursShort(180)).toBe("3 h")
  })
})
