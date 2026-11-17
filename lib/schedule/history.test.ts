import { describe, expect, it } from "vitest"

import type { Person } from "./compare"
import {
  MAX_HISTORY,
  mergePeopleIntoHistory,
  pastEntries,
  withoutHistoryEntry,
  type HistoryEntry,
} from "./history"

const person = (over: Partial<Person> = {}): Person => ({
  id: "p1",
  name: "Camila",
  colorId: "orange",
  courses: [],
  visible: true,
  sourceId: "abc123",
  ...over,
})

const entry = (sourceId: string, over: Partial<HistoryEntry> = {}): HistoryEntry => ({
  sourceId,
  name: sourceId,
  courses: [],
  savedAt: 1,
  ...over,
})

describe("mergePeopleIntoHistory", () => {
  it("adds people that came from a link, newest first", () => {
    const result = mergePeopleIntoHistory([entry("old")], [person()], 100)
    expect(result.map((e) => e.sourceId)).toEqual(["abc123", "old"])
    expect(result[0]).toMatchObject({ name: "Camila", savedAt: 100 })
  })

  it("ignores people without a link", () => {
    expect(mergePeopleIntoHistory([], [person({ sourceId: undefined })], 100)).toEqual([])
  })

  it("keeps the original date of someone already there", () => {
    const history = [entry("abc123", { name: "Camila", savedAt: 5 })]
    const result = mergePeopleIntoHistory(history, [person()], 999)
    expect(result[0].savedAt).toBe(5)
  })

  it("picks up a rename without moving the entry", () => {
    const history = [entry("x"), entry("abc123", { name: "Camila" })]
    const result = mergePeopleIntoHistory(history, [person({ name: "Cami" })], 999)
    expect(result.map((e) => e.sourceId)).toEqual(["x", "abc123"])
    expect(result[1].name).toBe("Cami")
  })

  it("returns the same list when nothing changes, so no write is needed", () => {
    const history = [entry("abc123", { name: "Camila" })]
    expect(mergePeopleIntoHistory(history, [person()], 999)).toBe(history)
  })

  it("drops the oldest entries beyond the cap", () => {
    const history = Array.from({ length: MAX_HISTORY }, (_, i) => entry(`id${i}`))
    const result = mergePeopleIntoHistory(history, [person({ sourceId: "fresh" })], 100)
    expect(result).toHaveLength(MAX_HISTORY)
    expect(result[0].sourceId).toBe("fresh")
    expect(result.some((e) => e.sourceId === `id${MAX_HISTORY - 1}`)).toBe(false)
  })
})

describe("withoutHistoryEntry", () => {
  it("removes only that entry", () => {
    expect(withoutHistoryEntry([entry("a"), entry("b")], "a").map((e) => e.sourceId)).toEqual(["b"])
  })
})

describe("pastEntries", () => {
  it("leaves out whoever is being compared right now", () => {
    const history = [entry("abc123"), entry("gone")]
    expect(pastEntries(history, [person()]).map((e) => e.sourceId)).toEqual(["gone"])
  })

  it("returns everything when nobody is compared", () => {
    expect(pastEntries([entry("a")], [])).toHaveLength(1)
  })
})
