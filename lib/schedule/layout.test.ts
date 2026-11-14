import { describe, expect, it } from "vitest"

import { layoutOverlappingBlocks } from "./layout"

describe("layoutOverlappingBlocks", () => {
  it("returns an empty map for no blocks", () => {
    expect(layoutOverlappingBlocks([]).size).toBe(0)
  })

  it("gives a lone block the full width", () => {
    const layout = layoutOverlappingBlocks([{ id: "a", start: "08:00", end: "09:00" }])
    expect(layout.get("a")).toEqual({ column: 0, totalColumns: 1 })
  })

  it("keeps back-to-back blocks in one column", () => {
    const layout = layoutOverlappingBlocks([
      { id: "a", start: "08:00", end: "09:00" },
      { id: "b", start: "09:00", end: "10:00" },
    ])
    expect(layout.get("a")).toEqual({ column: 0, totalColumns: 1 })
    expect(layout.get("b")).toEqual({ column: 0, totalColumns: 1 })
  })

  it("puts overlapping blocks side by side", () => {
    const layout = layoutOverlappingBlocks([
      { id: "a", start: "08:00", end: "10:00" },
      { id: "b", start: "09:00", end: "11:00" },
    ])
    expect(layout.get("a")).toEqual({ column: 0, totalColumns: 2 })
    expect(layout.get("b")).toEqual({ column: 1, totalColumns: 2 })
  })

  it("shares the width across a chain of overlaps", () => {
    const layout = layoutOverlappingBlocks([
      { id: "a", start: "08:00", end: "10:00" },
      { id: "b", start: "09:00", end: "11:00" },
      { id: "c", start: "10:00", end: "12:00" },
    ])
    // c reuses a's column but belongs to the same overlap group, so all use two columns.
    expect(layout.get("a")?.totalColumns).toBe(2)
    expect(layout.get("b")?.totalColumns).toBe(2)
    expect(layout.get("c")).toEqual({ column: 0, totalColumns: 2 })
  })
})
