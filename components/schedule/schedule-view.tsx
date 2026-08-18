"use client"

import { CalendarPlus, CalendarRange, Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { useSchedule } from "@/hooks/use-schedule"
import { getCourseGroups } from "@/lib/schedule/courses"
import type { Course, CourseDraft } from "@/lib/schedule/types"
import { CourseDialog } from "./course-dialog"
import { ScheduleGrid } from "./schedule-grid"

interface DialogState {
  open: boolean
  mode: "create" | "edit"
  editingId: string | null
  session: number
}

const CLOSED: DialogState = { open: false, mode: "create", editingId: null, session: 0 }

/** Top-level client orchestrator for the schedule maker. */
export function ScheduleView() {
  const { courses, visibleDays, nextColor, addCourse, updateCourse, removeCourse, clearAll } =
    useSchedule()
  const [dialog, setDialog] = useState<DialogState>(CLOSED)

  const editingCourse = useMemo(
    () => courses.find((course) => course.id === dialog.editingId) ?? null,
    [courses, dialog.editingId],
  )

  const courseGroups = useMemo(() => getCourseGroups(courses), [courses])

  const initialDraft = useMemo<CourseDraft>(() => {
    if (editingCourse) {
      const { title, room, start, end, days, colorId } = editingCourse
      return { title, room, start, end, days, colorId }
    }
    return {
      title: "",
      room: "",
      start: "08:00",
      end: "09:30",
      days: [],
      colorId: nextColor,
    }
  }, [editingCourse, nextColor])

  const openCreate = () =>
    setDialog((prev) => ({
      open: true,
      mode: "create",
      editingId: null,
      session: prev.session + 1,
    }))

  const openEdit = (course: Course) =>
    setDialog((prev) => ({
      open: true,
      mode: "edit",
      editingId: course.id,
      session: prev.session + 1,
    }))

  const close = () => setDialog((prev) => ({ ...prev, open: false }))

  const handleSubmit = (draft: CourseDraft) => {
    const result =
      dialog.mode === "edit" && dialog.editingId
        ? updateCourse(dialog.editingId, draft)
        : addCourse(draft)
    if (result.ok) close()
    return result
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CalendarRange className="size-5" />
          </span>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-balance">
              Creador de Horarios
            </h1>
            <p className="text-sm text-muted-foreground">
              {courses.length === 0
                ? "Organiza tus ramos en una grilla semanal."
                : `${courses.length} ${courses.length === 1 ? "ramo agregado" : "ramos agregados"}.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {courses.length > 0 ? (
            <Button variant="ghost" onClick={clearAll} className="h-10 px-3 text-muted-foreground">
              <Trash2 className="size-4" />
              Limpiar
            </Button>
          ) : null}
          <Button onClick={openCreate} className="h-10 px-4">
            <Plus className="size-4" />
            Agregar ramo
          </Button>
        </div>
      </header>

      {courses.length === 0 ? (
        <EmptyState onAdd={openCreate} />
      ) : null}

      <ScheduleGrid
        days={visibleDays}
        courses={courses}
        onEditCourse={openEdit}
        onDeleteCourse={removeCourse}
      />

      <CourseDialog
        open={dialog.open}
        mode={dialog.mode}
        formKey={`${dialog.mode}-${dialog.editingId ?? "new"}-${dialog.session}`}
        initialDraft={initialDraft}
        existingGroups={dialog.mode === "create" ? courseGroups : []}
        onClose={close}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

/** Friendly prompt shown when there are no courses yet. */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <CalendarPlus className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="font-heading font-semibold text-foreground">Tu horario está vacío</p>
        <p className="text-sm text-muted-foreground text-pretty">
          Agrega tu primer ramo para empezar a construir tu semana. La grilla se expandirá al fin de
          semana si lo necesitas.
        </p>
      </div>
      <Button onClick={onAdd} variant="outline" className="mt-1 h-10 px-4">
        <Plus className="size-4" />
        Agregar ramo
      </Button>
    </div>
  )
}
