import type { CourseColor, Day, DayId } from "./types"

/** Every day, in display order. */
export const DAYS: Day[] = [
  { id: "MON", label: "Lunes", short: "Lun", weekend: false },
  { id: "TUE", label: "Martes", short: "Mar", weekend: false },
  { id: "WED", label: "Miércoles", short: "Mié", weekend: false },
  { id: "THU", label: "Jueves", short: "Jue", weekend: false },
  { id: "FRI", label: "Viernes", short: "Vie", weekend: false },
  { id: "SAT", label: "Sábado", short: "Sáb", weekend: true },
  { id: "SUN", label: "Domingo", short: "Dom", weekend: true },
]

/** Days shown by default (the grid expands to weekends on demand). */
export const DEFAULT_DAY_IDS: DayId[] = ["MON", "TUE", "WED", "THU", "FRI"]

/** Fast lookup from id to descriptor. */
export const DAY_BY_ID: Record<DayId, Day> = DAYS.reduce(
  (acc, day) => {
    acc[day.id] = day
    return acc
  },
  {} as Record<DayId, Day>,
)

/** Grid vertical bounds, in whole hours (24h). */
export const START_HOUR = 8
export const END_HOUR = 22

/** Pixel height of a single hour row. Drives block sizing/positioning. */
export const HOUR_HEIGHT = 56

/** Snap increment for the time selects, in minutes. */
export const TIME_STEP_MINUTES = 15

/**
 * Course palette: macOS system colors tuned for dark surfaces. Ids from the
 * previous palette are kept so schedules saved in localStorage keep their color.
 * Blocks render the hex at low alpha with a solid accent bar.
 */
export const COURSE_COLORS: CourseColor[] = [
  { id: "blue", label: "Azul", hex: "#0a84ff" },
  { id: "sky", label: "Celeste", hex: "#64d2ff" },
  { id: "indigo", label: "Índigo", hex: "#5e5ce6" },
  { id: "teal", label: "Menta", hex: "#63e6e2" },
  { id: "emerald", label: "Verde", hex: "#30d158" },
  { id: "amber", label: "Ámbar", hex: "#ffd60a" },
  { id: "orange", label: "Naranja", hex: "#ff9f0a" },
  { id: "rose", label: "Rosa", hex: "#ff375f" },
  { id: "violet", label: "Violeta", hex: "#bf5af2" },
]

export const COLOR_BY_ID: Record<string, CourseColor> = COURSE_COLORS.reduce(
  (acc, color) => {
    acc[color.id] = color
    return acc
  },
  {} as Record<string, CourseColor>,
)
