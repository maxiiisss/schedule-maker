"use client"

import { toPng } from "html-to-image"
import { CalendarCheck, CalendarPlus, FileJson, ImageDown, Plus, Save, Share2, Trash2, Upload, Users } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { CompareBar } from "@/components/compare/compare-bar"
import { CompareDialog, type AddLinkResult } from "@/components/compare/compare-dialog"
import { SharePanel } from "@/components/share/share-panel"
import { Button } from "@/components/ui/button"
import { useNow } from "@/hooks/use-now"
import { usePeople } from "@/hooks/use-people"
import { useSchedule } from "@/hooks/use-schedule"
import { useViewState } from "@/hooks/use-view-state"
import { bestFreeSlot, buildComparison, commonFreeSlots, MAX_PEOPLE } from "@/lib/schedule/compare"
import { DAY_BY_ID } from "@/lib/schedule/constants"
import { getCourseGroups } from "@/lib/schedule/courses"
import {
  dateForDay,
  dayIdFromDate,
  formatDayTitle,
  formatMonthYear,
  hasWeekendCourses,
  weekViewDays,
} from "@/lib/schedule/days"
import { FLASH_STORAGE_KEY } from "@/lib/schedule/storage-keys"
import type { Course, CourseDraft, DayId } from "@/lib/schedule/types"
import { fetchShared, parseShareId } from "@/lib/share/client"
import { CourseDialog } from "./course-dialog"
import { DayTabs } from "./day-tabs"
import { Modal } from "./modal"
import { MobileActionBar, MobileFab } from "./mobile-bar"
import { ScheduleGrid, type NowMarker } from "./schedule-grid"
import { CourseChips, Logo, ScheduleSidebar } from "./schedule-sidebar"
import { Segmented } from "./segmented"
import { Toast } from "./toast"
import { WeekStrip } from "./week-strip"

interface DialogState {
  open: boolean
  mode: "create" | "edit"
  editingId: string | null
  session: number
}

/** Celeste outline for the actions that involve other people, so they stand apart from Guardar. */
const SOCIAL_BUTTON =
  "h-9 border-sky/40 bg-sky/10 px-2.5 text-sky hover:bg-sky/20 hover:text-sky aria-expanded:bg-sky/20 sm:px-3"

const CLOSED: DialogState = { open: false, mode: "create", editingId: null, session: 0 }

/** Top-level client orchestrator for the schedule maker. */
export function ScheduleView() {
  const {
    courses,
    ready,
    nextColor,
    addCourse,
    updateCourse,
    removeCourse,
    clearAll,
    restoreCourses,
  } = useSchedule()
  const [dialog, setDialog] = useState<DialogState>(CLOSED)
  const [saveOpen, setSaveOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [showFree, setShowFree] = useState(true)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [focusKey, setFocusKey] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null)
  const toastTimer = useRef<number | undefined>(undefined)
  const gridRef = useRef<HTMLDivElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const { mode, setMode, includeWeekend, setIncludeWeekend, selectedDay, setSelectedDay } = useViewState()
  const nowDate = useNow()
  const {
    people,
    add: addPerson,
    rename: renamePerson,
    toggle: togglePerson,
    remove: removePerson,
    restore: restorePeople,
  } = usePeople()

  const showToast = useCallback((message: string, undo?: () => void) => {
    window.clearTimeout(toastTimer.current)
    setToast({ message, undo })
    toastTimer.current = window.setTimeout(() => setToast(null), undo ? 6000 : 2600)
  }, [])
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  // An import from a shared page leaves a one-shot message for this page.
  useEffect(() => {
    try {
      const flash = window.sessionStorage.getItem(FLASH_STORAGE_KEY)
      if (!flash) return
      window.sessionStorage.removeItem(FLASH_STORAGE_KEY)
      showToast(flash)
    } catch {
      // storage unavailable: skip the message
    }
  }, [showToast])

  // With people to compare, the grid shows everyone's blocks, colored by person.
  const visiblePeople = useMemo(() => people.filter((person) => person.visible), [people])
  const comparing = visiblePeople.length > 0
  const gridCourses = useMemo(
    () => (comparing ? buildComparison(courses, people) : courses),
    [comparing, courses, people],
  )

  const days = useMemo(
    () => (mode === "day" ? [DAY_BY_ID[selectedDay]] : weekViewDays(gridCourses, includeWeekend)),
    [mode, selectedDay, gridCourses, includeWeekend],
  )
  const busyDays = useMemo(() => new Set<DayId>(gridCourses.flatMap((course) => course.days)), [gridCourses])
  // Only days where someone has class: a day nobody uses is trivially free.
  const freeSlots = useMemo(
    () =>
      comparing && showFree
        ? commonFreeSlots(
            [courses, ...visiblePeople.map((person) => person.courses)],
            days.map((day) => day.id).filter((id) => busyDays.has(id)),
          )
        : undefined,
    [comparing, showFree, courses, visiblePeople, days, busyDays],
  )
  const now = useMemo<NowMarker | null>(
    () =>
      nowDate
        ? {
            dayId: dayIdFromDate(nowDate),
            minutes: nowDate.getHours() * 60 + nowDate.getMinutes(),
            date: nowDate.getDate(),
          }
        : null,
    [nowDate],
  )

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
    if (result.ok) {
      close()
      const isNewSlot =
        dialog.mode === "create" &&
        courseGroups.some((group) => group.key === draft.title.trim().toLowerCase())
      showToast(
        dialog.mode === "edit"
          ? "Cambios guardados."
          : isNewSlot
            ? `Horario agregado a «${draft.title.trim()}».`
            : "Ramo agregado.",
      )
    }
    return result
  }

  const handleDelete = (id: string) => {
    const course = courses.find((item) => item.id === id)
    if (!course) return
    const snapshot = courses
    removeCourse(id)
    showToast(`«${course.title}» eliminado.`, () => restoreCourses(snapshot))
  }

  const handleClear = () => {
    const snapshot = courses
    clearAll()
    setFocusKey(null)
    showToast("Horario limpiado.", () => restoreCourses(snapshot))
  }

  // Export current schedule as a JSON file for downloading / backup.
  const handleExport = () => {
    try {
      const data = JSON.stringify(courses, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'horario.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      // ignore
    }
  }

  const handleCapture = async () => {
    if (!gridRef.current) return
    try {
      const dataUrl = await toPng(gridRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#26262b",
      })
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = "horario.png"
      a.click()
      setSaveMessage("Captura descargada.")
    } catch {
      setSaveMessage("No se pudo generar la captura.")
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!Array.isArray(parsed) || !parsed.every(isCourse)) throw new Error("invalid")
      restoreCourses(parsed)
      setSaveMessage("Horario restaurado correctamente.")
    } catch {
      setSaveMessage("El archivo no contiene un horario válido.")
    }
  }

  const addFromLink = async (text: string): Promise<AddLinkResult> => {
    const id = parseShareId(text)
    if (!id) {
      return {
        ok: false,
        message: "Ese no parece un enlace de ScheduleGrid. Pega el enlace completo que te enviaron.",
      }
    }

    const shared = await fetchShared(id)
    if (!shared.ok) {
      return {
        ok: false,
        message:
          shared.reason === "not-found"
            ? "Ese enlace no existe o ya no está disponible. Pide uno nuevo."
            : shared.reason === "rate-limited"
              ? "Hiciste demasiados intentos. Espera un minuto y vuelve a probar."
              : "No se pudo traer el horario. Revisa tu conexión y vuelve a intentarlo.",
      }
    }

    const added = addPerson({ name: shared.name, courses: shared.courses, sourceId: id })
    if (!added.ok) {
      return {
        ok: false,
        message:
          added.reason === "duplicate"
            ? "Ya agregaste este horario."
            : `Puedes comparar hasta ${MAX_PEOPLE} horarios a la vez. Quita uno para agregar otro.`,
      }
    }
    return { ok: true, message: `Se agregó «${added.person.name}». Puedes cambiarle el nombre abajo.` }
  }

  const handleRemovePerson = (id: string) => {
    const person = people.find((item) => item.id === id)
    if (!person) return
    const snapshot = people
    removePerson(id)
    showToast(`«${person.name}» quitado de la comparación.`, () => restorePeople(snapshot))
  }

  // A course on Saturday or Sunday keeps the weekend visible.
  const weekendLocked = hasWeekendCourses(gridCourses)
  const todayId = now?.dayId ?? null

  // Phone header: month of the shown day, and the full date under the week strip.
  const selectedDate = nowDate ? dateForDay(selectedDay, nowDate) : null
  const mobileTitle =
    mode === "day" && selectedDate
      ? formatMonthYear(selectedDate)
      : nowDate
        ? formatMonthYear(nowDate)
        : "ScheduleGrid"

  const goToday = () => {
    if (todayId) setSelectedDay(todayId)
    setMode("day")
  }

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <ScheduleSidebar groups={courseGroups} focusKey={focusKey} onFocus={setFocusKey} />

      <div className="flex min-w-0 flex-col">
        {/* Phones: slim bar with the month and a week strip, like Google Calendar and Calendar on iPhone. */}
        <div className="sticky top-0 z-30 border-b border-border bg-sidebar/85 backdrop-blur-xl backdrop-saturate-150 sm:hidden">
          <div className="flex items-center gap-2.5 px-4 pb-1.5 pt-3">
            <Logo className="size-8" />
            <h1 className="min-w-0 flex-1 truncate text-[19px] font-semibold tracking-tight">{mobileTitle}</h1>
            <Segmented
              label="Vista"
              value={mode}
              onChange={setMode}
              options={[
                { value: "day", label: "Día" },
                { value: "week", label: "Semana" },
              ]}
            />
          </div>
          {mode === "day" ? (
            <>
              <WeekStrip
                selected={selectedDay}
                today={todayId}
                reference={nowDate}
                busy={busyDays}
                onSelect={setSelectedDay}
              />
              <p className="px-4 pb-2.5 text-[13px] font-medium text-muted-foreground">
                {selectedDate ? formatDayTitle(selectedDate) : DAY_BY_ID[selectedDay].label}
              </p>
            </>
          ) : null}
        </div>

        <header className="sticky top-0 z-30 hidden border-b border-border bg-sidebar/80 px-3 py-3 backdrop-blur-xl backdrop-saturate-150 sm:block sm:px-5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2.5 xl:flex-nowrap">
            <div className="order-1 flex min-w-0 flex-1 items-center gap-2.5">
              <Logo className="lg:hidden" />
              <div className="hidden min-w-0 min-[480px]:block">
                <h1 className="truncate text-[15px] font-semibold leading-tight tracking-tight">
                  <span className="lg:hidden">ScheduleGrid</span>
                  <span className="hidden lg:inline">Mi horario</span>
                </h1>
                <p className="truncate text-xs text-muted-foreground">
                  {courseGroups.length === 0
                    ? "Organiza tus ramos en una semana."
                    : `${courseGroups.length} ${courseGroups.length === 1 ? "ramo" : "ramos"} · ${courses.length} ${courses.length === 1 ? "bloque" : "bloques"}`}
                </p>
              </div>
            </div>

            <div className="order-3 flex w-full flex-wrap items-center gap-2 xl:order-2 xl:w-auto">
              <Segmented
                label="Vista"
                value={mode}
                onChange={setMode}
                options={[
                  { value: "day", label: "Día" },
                  { value: "week", label: "Semana" },
                ]}
              />
              {mode === "week" ? (
                <Segmented
                  label="Días de la semana"
                  value={includeWeekend || weekendLocked ? "full" : "work"}
                  onChange={(value) => setIncludeWeekend(value === "full")}
                  options={[
                    { value: "work", label: "Lun–Vie", disabled: weekendLocked },
                    { value: "full", label: "Lun–Dom" },
                  ]}
                />
              ) : null}
            </div>

            {/* Actions in tiers: quiet (clear), neutral (save), celeste (compare/share), solid (add). */}
            <div className="order-2 flex items-center gap-1.5 xl:order-3">
              {courses.length > 0 ? (
                <Button
                  variant="ghost"
                  onClick={handleClear}
                  aria-label="Limpiar horario"
                  title="Limpiar"
                  className="h-9 px-2.5 hover:text-destructive sm:px-3"
                >
                  <Trash2 className="size-4" />
                  <span className="hidden sm:inline">Limpiar</span>
                </Button>
              ) : null}
              <Button
                variant="outline"
                aria-label="Guardar horario"
                title="Guardar"
                onClick={() => {
                  setSaveMessage(null)
                  setSaveOpen(true)
                }}
                className="h-9 px-2.5 sm:px-3"
              >
                <Save className="size-4" />
                <span className="hidden sm:inline">Guardar</span>
              </Button>

              <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />

              <Button
                variant="outline"
                aria-label={comparing ? `Comparar horarios (${visiblePeople.length} activos)` : "Comparar horarios"}
                title="Comparar"
                onClick={() => setCompareOpen(true)}
                className={SOCIAL_BUTTON}
              >
                <Users className="size-4" />
                <span className="hidden sm:inline">Comparar</span>
                {comparing ? (
                  <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-sky px-1 text-[11px] font-semibold text-[#06222e]">
                    {visiblePeople.length}
                  </span>
                ) : null}
              </Button>
              <Button
                variant="outline"
                aria-label="Compartir horario"
                title="Compartir"
                onClick={() => setShareOpen(true)}
                className={SOCIAL_BUTTON}
              >
                <Share2 className="size-4" />
                <span className="hidden sm:inline">Compartir</span>
              </Button>

              <span aria-hidden className="mx-0.5 h-5 w-px bg-border" />

              <Button onClick={openCreate} className="h-9 px-3.5">
                <Plus className="size-4" />
                <span className="sm:hidden">Agregar</span>
                <span className="hidden sm:inline">Agregar ramo</span>
              </Button>
            </div>
          </div>
        </header>

        <CourseChips groups={courseGroups} focusKey={focusKey} onFocus={setFocusKey} />

        <div className="flex flex-col gap-3 pb-28 sm:px-5 sm:py-5 sm:pb-5 max-sm:pt-3">
          {ready && courses.length === 0 ? (
            <div className="max-sm:px-3">
              <EmptyState onAdd={openCreate} />
            </div>
          ) : null}

          {people.length > 0 ? (
            <div className="max-sm:px-3">
              <CompareBar
                people={people}
                showFree={showFree}
                onShowFreeChange={setShowFree}
                bestSlot={freeSlots ? bestFreeSlot(freeSlots) : null}
                onManage={() => setCompareOpen(true)}
              />
            </div>
          ) : null}

          {mode === "day" ? (
            <div className="hidden sm:block">
              <DayTabs selected={selectedDay} today={todayId} busy={busyDays} onSelect={setSelectedDay} />
            </div>
          ) : null}

          <ScheduleGrid
            days={days}
            courses={gridCourses}
            freeSlots={freeSlots}
            crowded={comparing}
            focusKey={focusKey}
            now={now}
            onEditCourse={openEdit}
            onDeleteCourse={handleDelete}
            gridRef={gridRef}
          />
        </div>
      </div>

      <CourseDialog
        open={dialog.open}
        mode={dialog.mode}
        formKey={`${dialog.mode}-${dialog.editingId ?? "new"}-${dialog.session}`}
        initialDraft={initialDraft}
        existingGroups={dialog.mode === "create" ? courseGroups : []}
        onClose={close}
        onSubmit={handleSubmit}
        onDelete={
          dialog.editingId
            ? () => {
                const id = dialog.editingId
                close()
                if (id) handleDelete(id)
              }
            : undefined
        }
      />

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleImport}
        className="hidden"
      />

      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        title="Guardar horario"
        description="Conserva tu horario en este dispositivo o descarga una copia."
      >
        <div className="grid gap-2">
          <Button variant="outline" onClick={handleCapture} className="h-10 justify-start px-3.5">
            <ImageDown className="size-4" />
            Descargar captura PNG
          </Button>
          <Button variant="outline" onClick={handleExport} className="h-10 justify-start px-3.5">
            <FileJson className="size-4" />
            Descargar respaldo JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => importInputRef.current?.click()}
            className="h-10 justify-start px-3.5"
          >
            <Upload className="size-4" />
            Restaurar desde un respaldo
          </Button>
          {courses.length > 0 ? (
            <Button
              variant="ghost"
              onClick={() => {
                setSaveOpen(false)
                handleClear()
              }}
              className="h-10 justify-start px-3.5 text-destructive hover:text-destructive sm:hidden"
            >
              <Trash2 className="size-4" />
              Limpiar horario
            </Button>
          ) : null}
          <p className="mt-2 text-[13px] text-muted-foreground text-pretty">
            El horario se guarda automáticamente en este navegador y se recuperará al volver a abrir la página.
          </p>
          {saveMessage ? (
            <p role="status" className="text-[13px] font-medium text-sky">
              {saveMessage}
            </p>
          ) : null}
        </div>
      </Modal>

      <CompareDialog
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        people={people}
        onAddLink={addFromLink}
        onRename={renamePerson}
        onToggle={togglePerson}
        onRemove={handleRemovePerson}
      />

      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Compartir horario"
        description="Crea un enlace para enviar tu horario por WhatsApp u otra app."
      >
        <SharePanel courses={courses} />
      </Modal>

      <MobileActionBar
        items={[
          { label: "Hoy", icon: CalendarCheck, onClick: goToday },
          { label: "Comparar", icon: Users, onClick: () => setCompareOpen(true), badge: visiblePeople.length, accent: true },
          { label: "Compartir", icon: Share2, onClick: () => setShareOpen(true), accent: true },
          {
            label: "Guardar",
            icon: Save,
            onClick: () => {
              setSaveMessage(null)
              setSaveOpen(true)
            },
          },
        ]}
      />
      <MobileFab label="Agregar ramo" onClick={openCreate} />

      <Toast
        message={toast?.message ?? null}
        actionLabel={toast?.undo ? "Deshacer" : undefined}
        onAction={() => {
          toast?.undo?.()
          window.clearTimeout(toastTimer.current)
          setToast(null)
        }}
      />
    </div>
  )
}

function isCourse(value: unknown): value is Course {
  if (!value || typeof value !== "object") return false
  const course = value as Partial<Course>
  return (
    typeof course.id === "string" &&
    typeof course.title === "string" &&
    typeof course.room === "string" &&
    typeof course.start === "string" &&
    typeof course.end === "string" &&
    typeof course.colorId === "string" &&
    Array.isArray(course.days) &&
    course.days.every((day) => typeof day === "string")
  )
}

/** Friendly prompt shown when there are no courses yet. */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-input px-6 py-8 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-accent text-sky">
        <CalendarPlus className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-[15px] font-semibold text-foreground">Tu horario está vacío</p>
        <p className="mx-auto max-w-[46ch] text-[13px] text-muted-foreground text-pretty">
          Agrega tu primer ramo para armar la semana. Si tienes clases el fin de semana, la grilla se
          amplía sola.
        </p>
      </div>
      <Button onClick={onAdd} className="mt-1 h-9 px-4">
        <Plus className="size-4" />
        Agregar ramo
      </Button>
    </div>
  )
}
