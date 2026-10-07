import { END_HOUR, HOUR_HEIGHT, START_HOUR, TIME_STEP_MINUTES } from "./constants"

/** Convert an "HH:mm" string into minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/** Convert minutes since midnight into an "HH:mm" string. */
export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, minutes))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/** Human friendly label for a time, e.g. "08:00". */
export function formatTime(time: string): string {
  return time
}

/** Duration between two "HH:mm" times, in minutes. */
export function durationMinutes(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start)
}

/**
 * All selectable time options between START_HOUR and END_HOUR,
 * stepped by TIME_STEP_MINUTES. Used to populate the time selects.
 */
export function generateTimeOptions(): string[] {
  const options: string[] = []
  const from = START_HOUR * 60
  const to = END_HOUR * 60
  for (let m = from; m <= to; m += TIME_STEP_MINUTES) {
    options.push(minutesToTime(m))
  }
  return options
}

/** Whole-hour labels for the Y axis (e.g. 08:00 … 22:00). */
export function generateHourLabels(): string[] {
  const labels: string[] = []
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    labels.push(minutesToTime(h * 60))
  }
  return labels
}

/** Vertical offset (px) of a time relative to the top of the grid. */
export function offsetForTime(time: string): number {
  const minutes = timeToMinutes(time) - START_HOUR * 60
  return (minutes / 60) * HOUR_HEIGHT
}

/** Height (px) of a block spanning [start, end). */
export function heightForRange(start: string, end: string): number {
  return (durationMinutes(start, end) / 60) * HOUR_HEIGHT
}

/** Total pixel height of the grid body. */
export function gridBodyHeight(): number {
  return (END_HOUR - START_HOUR) * HOUR_HEIGHT
}

/** True when the range sits within the visible grid bounds. */
export function isWithinGridBounds(start: string, end: string): boolean {
  return (
    timeToMinutes(start) >= START_HOUR * 60 &&
    timeToMinutes(end) <= END_HOUR * 60
  )
}

/** Readable duration, e.g. "1 h 30 min", "3 h", "45 min". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h} h ${m} min`
  if (h) return `${h} h`
  return `${m} min`
}

/** Compact hours for tight spots, e.g. "1,5 h". */
export function formatHoursShort(minutes: number): string {
  const hours = minutes / 60
  const text = Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(".", ",")
  return `${text} h`
}
