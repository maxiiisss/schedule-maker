import { rangesOverlap } from "./collisions"
import { timeToMinutes } from "./time"

/** Minimal shape needed to compute horizontal layout within a day column. */
export interface TimedBlock {
  id: string
  start: string
  end: string
}

/** Horizontal placement of a block when it shares time with others. */
export interface BlockLayout {
  /** Zero-based column index within the overlap group. */
  column: number
  /** Total columns in the overlap group (blocks split width equally). */
  totalColumns: number
}

/**
 * Assign side-by-side columns to blocks that overlap in time on the same day.
 *
 * Pure domain logic: the grid component only applies these values as CSS.
 * Algorithm: greedy column packing + transitive overlap groups for width.
 */
export function layoutOverlappingBlocks(
  blocks: TimedBlock[],
): Map<string, BlockLayout> {
  const result = new Map<string, BlockLayout>()
  if (blocks.length === 0) return result

  const sorted = [...blocks].sort(
    (a, b) =>
      timeToMinutes(a.start) - timeToMinutes(b.start) ||
      timeToMinutes(b.end) - timeToMinutes(a.end),
  )

  const columnEndTimes: number[] = []
  const columnById = new Map<string, number>()

  for (const block of sorted) {
    const startMin = timeToMinutes(block.start)
    const freeColumn = columnEndTimes.findIndex((end) => end <= startMin)
    const column = freeColumn === -1 ? columnEndTimes.length : freeColumn

    if (freeColumn === -1) {
      columnEndTimes.push(timeToMinutes(block.end))
    } else {
      columnEndTimes[column] = timeToMinutes(block.end)
    }

    columnById.set(block.id, column)
  }

  for (const block of blocks) {
    const group = getOverlapGroup(block.id, blocks)
    const columnsInGroup = [...group].map((id) => columnById.get(id) ?? 0)
    result.set(block.id, {
      column: columnById.get(block.id) ?? 0,
      totalColumns: Math.max(...columnsInGroup) + 1,
    })
  }

  return result
}

/** Collect every block that overlaps transitively with the given one. */
function getOverlapGroup(blockId: string, blocks: TimedBlock[]): Set<string> {
  const byId = new Map(blocks.map((block) => [block.id, block]))
  const visited = new Set<string>()
  const stack = [blockId]

  while (stack.length > 0) {
    const id = stack.pop()
    if (!id || visited.has(id)) continue
    visited.add(id)

    const current = byId.get(id)
    if (!current) continue

    for (const other of blocks) {
      if (
        !visited.has(other.id) &&
        rangesOverlap(current.start, current.end, other.start, other.end)
      ) {
        stack.push(other.id)
      }
    }
  }

  return visited
}
