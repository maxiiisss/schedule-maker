"use client"

import { AlertCircle } from "lucide-react"
import { useState } from "react"

import type { MutationResult } from "@/hooks/use-schedule"
import type { CourseGroup } from "@/lib/schedule/courses"
import type { CourseDraft, DayId, ValidationError } from "@/lib/schedule/types"
import { errorFor } from "@/lib/schedule/validation"
import { ColorPicker } from "./color-picker"
import { DaySelector } from "./day-selector"
import { ExistingCoursePicker } from "./existing-course-picker"

const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground tabular-nums transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 aria-[invalid=true]:border-destructive"

interface CourseFormProps {
  formId: string
  mode: "create" | "edit"
  initialDraft: CourseDraft
  existingGroups?: CourseGroup[]
  onSubmit: (draft: CourseDraft) => MutationResult
}

/** Field label with consistent spacing. */
function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </label>
      {children}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  )
}

/**
 * Controlled form for creating/editing a course.
 *
 * Owns only local draft + error state; all validation is delegated to the
 * `onSubmit` handler (which runs the pure domain rules).
 */
export function CourseForm({
  formId,
  mode,
  initialDraft,
  existingGroups = [],
  onSubmit,
}: CourseFormProps) {
  const [draft, setDraft] = useState<CourseDraft>(initialDraft)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [selectedGroup, setSelectedGroup] = useState<CourseGroup | null>(null)

  const isAddingSlot = mode === "create" && selectedGroup !== null

  const set = <K extends keyof CourseDraft>(key: K, value: CourseDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const handleGroupSelect = (group: CourseGroup | null) => {
    setSelectedGroup(group)
    if (group) {
      setDraft((prev) => ({
        ...prev,
        title: group.title,
        colorId: group.colorId,
        room: "",
        days: [],
      }))
    } else {
      setDraft((prev) => ({
        ...prev,
        title: "",
        colorId: initialDraft.colorId,
      }))
    }
    setErrors([])
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const result = onSubmit(draft)
    if (!result.ok) setErrors(result.errors)
  }

  const formError = errorFor(errors, "form")

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4" noValidate>
      {mode === "create" && existingGroups.length > 0 ? (
        <ExistingCoursePicker
          groups={existingGroups}
          selectedTitle={selectedGroup?.title ?? null}
          onSelect={handleGroupSelect}
        />
      ) : null}

      {isAddingSlot ? (
        <Field label="Ramo seleccionado">
          <div className="flex h-9 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium text-foreground">
            {draft.title}
          </div>
        </Field>
      ) : (
        <Field label="Nombre del ramo" htmlFor="course-title" error={errorFor(errors, "title")}>
          <input
            id="course-title"
            type="text"
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Ej. Cálculo Diferencial"
            aria-invalid={Boolean(errorFor(errors, "title"))}
            className={fieldClass}
          />
        </Field>
      )}

      <Field label="Sala (opcional)" htmlFor="course-room">
        <input
          id="course-room"
          type="text"
          value={draft.room}
          onChange={(e) => set("room", e.target.value)}
          placeholder="Ej. Sala 204 / Lab. B"
          className={fieldClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Hora de inicio" htmlFor="course-start" error={errorFor(errors, "start")}>
          <input
            id="course-start"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="HH:mm (ej: 13:50)"
            value={draft.start}
            onChange={(e) => set("start", e.target.value)}
            aria-invalid={Boolean(errorFor(errors, "start"))}
            className={fieldClass}
          />
        </Field>

        <Field label="Hora de término" htmlFor="course-end" error={errorFor(errors, "end")}>
          <input
            id="course-end"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="HH:mm (ej: 14:50)"
            value={draft.end}
            onChange={(e) => set("end", e.target.value)}
            aria-invalid={Boolean(errorFor(errors, "end"))}
            className={fieldClass}
          />
        </Field>
      </div>

      <Field label="Días" error={errorFor(errors, "days")}>
        <DaySelector
          value={draft.days}
          onChange={(days: DayId[]) => set("days", days)}
          invalid={Boolean(errorFor(errors, "days"))}
        />
      </Field>

      <Field label="Color">
        <ColorPicker
          value={draft.colorId}
          onChange={(colorId) => set("colorId", colorId)}
          disabled={isAddingSlot}
        />
        {isAddingSlot ? (
          <p className="text-xs text-muted-foreground">
            El color se mantiene igual al del ramo original.
          </p>
        ) : null}
      </Field>

      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      ) : null}
    </form>
  )
}
