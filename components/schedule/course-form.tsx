"use client"

import { AlertCircle, Plus, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import type { MutationResult } from "@/hooks/use-schedule"
import type { CourseGroup } from "@/lib/schedule/courses"
import { normalizeTimeInput } from "@/lib/schedule/time"
import type { CourseDraft, DayId, ValidationError } from "@/lib/schedule/types"
import { errorFor } from "@/lib/schedule/validation"
import { ColorPicker } from "./color-picker"
import { DaySelector } from "./day-selector"
import { CoursePicker, SlotSummary } from "./course-picker"

const fieldClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground tabular-nums transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 aria-[invalid=true]:border-destructive"

/** When and where a ramo meets: one day selection sharing a single time range. */
type SlotValues = Pick<CourseDraft, "room" | "start" | "end" | "days">
type SlotState = SlotValues & { key: number }

const MAX_SLOTS = 8

interface CourseFormProps {
  formId: string
  mode: "create" | "edit"
  initialDraft: CourseDraft
  existingGroups?: CourseGroup[]
  /** Receives one draft per time slot (always exactly one when editing). */
  onSubmit: (drafts: CourseDraft[]) => MutationResult
  /** Reports the ramo getting a new time slot (null when creating a new ramo). */
  onSelectedTitleChange?: (title: string | null) => void
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
 * A new ramo can have several time slots (e.g. Monday 11:30-13:00 and Wednesday 15:00-17:00),
 * each with its own days, hours and room. Editing works on a single block.
 * Owns only local draft + error state; all validation is delegated to the
 * `onSubmit` handler (which runs the pure domain rules).
 */
export function CourseForm({
  formId,
  mode,
  initialDraft,
  existingGroups = [],
  onSubmit,
  onSelectedTitleChange,
}: CourseFormProps) {
  const nextKey = useRef(1)
  const [title, setTitle] = useState(initialDraft.title)
  const [colorId, setColorId] = useState(initialDraft.colorId)
  const [slots, setSlots] = useState<SlotState[]>(() => [
    {
      key: 0,
      room: initialDraft.room,
      start: initialDraft.start,
      end: initialDraft.end,
      days: initialDraft.days,
    },
  ])
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [selectedGroup, setSelectedGroup] = useState<CourseGroup | null>(null)

  const isAddingSlot = mode === "create" && selectedGroup !== null
  const canAddSlots = mode === "create"
  const hasSeveral = slots.length > 1

  useEffect(() => {
    onSelectedTitleChange?.(isAddingSlot ? selectedGroup.title : null)
  }, [isAddingSlot, selectedGroup, onSelectedTitleChange])

  const setSlot = (index: number, patch: Partial<SlotValues>) => {
    setSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)))
  }

  const addSlot = () => {
    setSlots((prev) => {
      if (prev.length >= MAX_SLOTS) return prev
      // The next slot usually repeats the room and length; only the days and start differ.
      const last = prev[prev.length - 1]
      return [...prev, { key: nextKey.current++, room: last.room, start: last.start, end: last.end, days: [] }]
    })
  }

  const removeSlot = (index: number) => {
    setSlots((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
    setErrors([])
  }

  const handleGroupSelect = (group: CourseGroup | null) => {
    setSelectedGroup(group)
    if (group) {
      // Start from the latest slot: only the days usually differ from it.
      const latest = group.slots[group.slots.length - 1]
      setTitle(group.title)
      setColorId(group.colorId)
      setSlots([
        {
          key: nextKey.current++,
          room: latest?.room ?? "",
          start: latest?.start ?? slots[0].start,
          end: latest?.end ?? slots[0].end,
          days: [],
        },
      ])
    } else {
      setTitle("")
      setColorId(initialDraft.colorId)
    }
    setErrors([])
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const tidy = slots.map((slot) => ({
      ...slot,
      start: normalizeTimeInput(slot.start),
      end: normalizeTimeInput(slot.end),
    }))
    setSlots(tidy)
    const result = onSubmit(
      tidy.map(({ room, start, end, days }) => ({ title, colorId, room, start, end, days })),
    )
    if (!result.ok) setErrors(result.errors)
  }

  /**
   * Props shared by both time fields. Phone keypads have no colon, so "1030" is turned into
   * "10:30" as soon as four digits are typed, and any other shorthand ("930", "9", "10.30")
   * when the field loses focus or the form is submitted.
   */
  const timeField = (index: number, key: "start" | "end", hint: "next" | "done") => ({
    type: "text" as const,
    // "decimal" shows digits plus a separator key on phones; the numeric pad has neither colon nor dot.
    inputMode: "decimal" as const,
    enterKeyHint: hint,
    autoComplete: "off",
    maxLength: 5,
    value: slots[index][key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      const typed = event.target.value.replace(/[^\d:.,hH]/g, "")
      setSlot(index, { [key]: /^\d{4}$/.test(typed) ? normalizeTimeInput(typed) : typed })
    },
    onBlur: () => setSlot(index, { [key]: normalizeTimeInput(slots[index][key]) }),
    "aria-invalid": Boolean(errorFor(errors, key, index)),
    className: fieldClass,
  })

  const formError = errorFor(errors, "form")

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4" noValidate>
      {mode === "create" && existingGroups.length > 0 ? (
        <CoursePicker
          groups={existingGroups}
          selectedKey={selectedGroup?.key ?? null}
          onSelect={handleGroupSelect}
        />
      ) : null}

      {isAddingSlot && selectedGroup ? (
        <div className="space-y-2">
          <SlotSummary group={selectedGroup} />
          <p className="text-xs text-muted-foreground text-pretty">
            Elige los días y la hora del nuevo horario. Si el ramo tiene más, puedes agregarlos abajo.
          </p>
        </div>
      ) : (
        <Field label="Nombre del ramo" htmlFor="course-title" error={errorFor(errors, "title")}>
          <input
            id="course-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Cálculo Diferencial"
            aria-invalid={Boolean(errorFor(errors, "title"))}
            className={fieldClass}
          />
        </Field>
      )}

      {slots.map((slot, index) => (
        <fieldset
          key={slot.key}
          className={
            hasSeveral
              ? "space-y-3 rounded-lg border border-border bg-muted/30 p-3"
              : "space-y-4 border-0 p-0"
          }
        >
          {hasSeveral ? (
            <legend className="sr-only">Horario {index + 1}</legend>
          ) : null}
          {hasSeveral ? (
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium" aria-hidden>
                Horario {index + 1}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSlot(index)}
                aria-label={`Quitar horario ${index + 1}`}
                className="relative -mr-1 size-7 after:absolute after:-inset-2 after:content-['']"
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Hora de inicio"
              htmlFor={`course-start-${slot.key}`}
              error={errorFor(errors, "start", index)}
            >
              <input
                id={`course-start-${slot.key}`}
                placeholder="HH:mm (ej: 13:50)"
                {...timeField(index, "start", "next")}
              />
            </Field>

            <Field
              label="Hora de término"
              htmlFor={`course-end-${slot.key}`}
              error={errorFor(errors, "end", index)}
            >
              <input
                id={`course-end-${slot.key}`}
                placeholder="HH:mm (ej: 14:50)"
                {...timeField(index, "end", "done")}
              />
            </Field>
          </div>

          <Field label="Días" error={errorFor(errors, "days", index)}>
            <DaySelector
              value={slot.days}
              onChange={(days: DayId[]) => setSlot(index, { days })}
              invalid={Boolean(errorFor(errors, "days", index))}
            />
          </Field>

          <Field label="Sala (opcional)" htmlFor={`course-room-${slot.key}`}>
            <input
              id={`course-room-${slot.key}`}
              type="text"
              value={slot.room}
              onChange={(e) => setSlot(index, { room: e.target.value })}
              placeholder="Ej. Sala 204 / Lab. B"
              className={fieldClass}
            />
          </Field>
        </fieldset>
      ))}

      {canAddSlots && slots.length < MAX_SLOTS ? (
        <Button
          type="button"
          variant="outline"
          onClick={addSlot}
          className="h-10 w-full justify-center roomy:h-9"
        >
          <Plus className="size-4" aria-hidden />
          Agregar otro horario
        </Button>
      ) : null}

      {isAddingSlot ? null : (
        <Field label="Color">
          <ColorPicker value={colorId} onChange={setColorId} />
        </Field>
      )}

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
