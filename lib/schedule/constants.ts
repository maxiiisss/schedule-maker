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
export const HOUR_HEIGHT = 64

/** Snap increment for the time selects, in minutes. */
export const TIME_STEP_MINUTES = 15

/**
 * Harmonious palette assigned to courses. Colors are chosen to stay
 * distinguishable and legible over both light and dark backgrounds
 * (blocks render the hex at low alpha with a solid accent bar).
 */
export const COURSE_COLORS: CourseColor[] = [
  { id: "indigo", label: "Índigo", hex: "#6366f1" },
  { id: "sky", label: "Celeste", hex: "#0ea5e9" },
  { id: "emerald", label: "Esmeralda", hex: "#10b981" },
  { id: "amber", label: "Ámbar", hex: "#f59e0b" },
  { id: "rose", label: "Rosa", hex: "#f43f5e" },
  { id: "violet", label: "Violeta", hex: "#8b5cf6" },
  { id: "teal", label: "Turquesa", hex: "#14b8a6" },
  { id: "orange", label: "Naranjo", hex: "#f97316" },
]

export const COLOR_BY_ID: Record<string, CourseColor> = COURSE_COLORS.reduce(
  (acc, color) => {
    acc[color.id] = color
    return acc
  },
  {} as Record<string, CourseColor>,
)
