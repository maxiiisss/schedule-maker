import { isWithinGridBounds, timeToMinutes } from "./time"
import type { CourseDraft, ValidationError } from "./types"

/** Check if a time string is in valid HH:mm format. */
function isValidTimeFormat(time: string): boolean {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)
}

/**
 * Validate a course draft against the schedule rules.
 *
 * Pure function: returns a list of errors (empty means valid). Business
 * rules live here, not in the UI, so they can be reused server-side later.
 *
 * Overlapping blocks are allowed — the grid lays them out side by side.
 */
export function validateCourseDraft(draft: CourseDraft): ValidationError[] {
  const errors: ValidationError[] = []

  if (!draft.title.trim()) {
    errors.push({ field: "title", message: "Ingresa el nombre del ramo." })
  }

  if (draft.days.length === 0) {
    errors.push({ field: "days", message: "Selecciona al menos un día." })
  }

  if (!draft.start || !draft.end) {
    errors.push({ field: "start", message: "Define la hora de inicio y término." })
  } else if (!isValidTimeFormat(draft.start)) {
    errors.push({ field: "start", message: "Formato de hora inválido. Usa HH:mm (ej: 13:50)." })
  } else if (!isValidTimeFormat(draft.end)) {
    errors.push({ field: "end", message: "Formato de hora inválido. Usa HH:mm (ej: 14:50)." })
  } else if (timeToMinutes(draft.end) <= timeToMinutes(draft.start)) {
    errors.push({
      field: "end",
      message: "La hora de término debe ser posterior a la de inicio.",
    })
  } else if (!isWithinGridBounds(draft.start, draft.end)) {
    errors.push({
      field: "end",
      message: "El horario debe estar dentro del rango visible de la grilla.",
    })
  }

  return errors
}

/** Convenience helper to read a field's message from an error list. */
export function errorFor(
  errors: ValidationError[],
  field: ValidationError["field"],
): string | undefined {
  return errors.find((error) => error.field === field)?.message
}
