"use client"

import { ArrowLeft, Check, MoreHorizontal, Plus, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { DayTabs } from "@/components/schedule/day-tabs"
import { Modal } from "@/components/schedule/modal"
import { MenuItem, MenuSeparator, PopoverMenu } from "@/components/schedule/popover-menu"
import { ScheduleGrid, type NowMarker } from "@/components/schedule/schedule-grid"
import { Logo } from "@/components/schedule/schedule-sidebar"
import { Segmented } from "@/components/schedule/segmented"
import { SkipLink } from "@/components/schedule/skip-link"
import { SwipeDays } from "@/components/schedule/swipe-days"
import { Button } from "@/components/ui/button"
import { useNow } from "@/hooks/use-now"
import { useViewState } from "@/hooks/use-view-state"
import { cn } from "@/lib/utils"
import { colorStyles, resolveColor } from "@/lib/schedule/colors"
import {
  bestFreeSlot,
  buildComparison,
  commonFreeSlots,
  formatMinutes,
  MAX_PEOPLE,
  nextPersonColor,
  PERSON_COLOR_IDS,
  type Person,
} from "@/lib/schedule/compare"
import { DAY_BY_ID } from "@/lib/schedule/constants"
import { dayIdFromDate, weekViewDays } from "@/lib/schedule/days"
import { mergeCourses } from "@/lib/schedule/merge"
import { readPeople, withPerson, writePeople } from "@/lib/schedule/people"
import { FLASH_STORAGE_KEY, SCHEDULE_STORAGE_KEY } from "@/lib/schedule/storage-keys"
import { formatDuration } from "@/lib/schedule/time"
import type { Course, DayId } from "@/lib/schedule/types"

function readOwnCourses(): Course[] {
  try {
    const raw = window.localStorage.getItem(SCHEDULE_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? (parsed as Course[]) : []
  } catch {
    return []
  }
}

interface SharedScheduleViewProps {
  /** Id in the share link, used to avoid adding the same schedule twice. */
  shareId: string
  name: string
  courses: Course[]
}

/**
 * Page for a schedule opened from a share link.
 *
 * It opens on the other person's schedule. Two layers, theirs and the visitor's own, can be
 * switched on and off like the calendars in a calendar app; the chips that switch them are also
 * the legend. What to do with the schedule (compare, add, replace) lives apart from how to look
 * at it, in one primary action plus a menu. Nothing changes the visitor's data until they choose.
 */
export function SharedScheduleView({ shareId, name, courses }: SharedScheduleViewProps) {
  const router = useRouter()
  const { mode, setMode, selectedDay, setSelectedDay } = useViewState()
  const nowDate = useNow()
  const [showTheirs, setShowTheirs] = useState(true)
  const [showMine, setShowMine] = useState(false)
  const [showFree, setShowFree] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmingReplace, setConfirmingReplace] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [own, setOwn] = useState<Course[]>([])

  // Read after mount so the server and client markup match.
  useEffect(() => {
    setOwn(readOwnCourses())
  }, [])
  const hasOwn = own.length > 0

  const owner = name || "Horario compartido"
  const firstName = name.trim().split(/\s+/)[0]?.slice(0, 12) ?? ""
  const theirLabel = firstName || "Este horario"

  const person = useMemo<Person>(
    () => ({
      id: "shared",
      name: name || "Compartido",
      colorId: nextPersonColor([]),
      courses,
      visible: true,
      sourceId: shareId,
    }),
    [name, courses, shareId],
  )

  const both = showTheirs && showMine && hasOwn
  const gridCourses = useMemo(() => {
    if (both) return buildComparison(own, [person])
    if (showMine && hasOwn && !showTheirs) return own
    return courses
  }, [both, showMine, showTheirs, hasOwn, own, person, courses])

  const days = useMemo(
    () => (mode === "day" ? [DAY_BY_ID[selectedDay]] : weekViewDays(gridCourses, false)),
    [mode, selectedDay, gridCourses],
  )
  const busyDays = useMemo(() => new Set<DayId>(gridCourses.flatMap((course) => course.days)), [gridCourses])
  const freeSlots = useMemo(
    () =>
      both && showFree
        ? commonFreeSlots([own, courses], days.map((day) => day.id).filter((id) => busyDays.has(id)))
        : undefined,
    [both, showFree, own, courses, days, busyDays],
  )
  const bestSlot = freeSlots ? bestFreeSlot(freeSlots) : null

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

  // At least one layer always stays on, so the grid never goes blank.
  const toggleTheirs = () => {
    if (showTheirs && !showMine) return
    setShowTheirs(!showTheirs)
  }
  const toggleMine = () => {
    if (showMine && !showTheirs) return
    setShowMine(!showMine)
  }

  /** Add these courses to the user's schedule, keeping everything already there. */
  const addToMine = () => {
    const result = mergeCourses(readOwnCourses(), courses)
    try {
      window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(result.courses))
      window.sessionStorage.setItem(
        FLASH_STORAGE_KEY,
        result.added === 0
          ? "Ese horario ya estaba en el tuyo: no se agregó nada."
          : `Se ${result.added === 1 ? "agregó 1 ramo" : `agregaron ${result.added} ramos`} a tu horario${result.skipped > 0 ? ` (${result.skipped} ya ${result.skipped === 1 ? "estaba" : "estaban"})` : ""}.`,
      )
    } catch {
      setMessage("No se pudo guardar en este navegador. Revisa que el almacenamiento esté permitido.")
      return
    }
    router.push("/")
  }

  /** Replace the user's schedule with this one. Only runs after the confirmation dialog. */
  const replaceMine = () => {
    try {
      window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(courses))
      window.sessionStorage.setItem(FLASH_STORAGE_KEY, "Tu horario fue reemplazado.")
    } catch {
      setConfirmingReplace(false)
      setMessage("No se pudo guardar en este navegador. Revisa que el almacenamiento esté permitido.")
      return
    }
    router.push("/")
  }

  const keepComparing = () => {
    const result = withPerson(readPeople(), { name, courses, sourceId: shareId })
    if (!result.ok && result.reason === "limit") {
      setMessage(`Puedes comparar hasta ${MAX_PEOPLE} horarios a la vez. Quita uno desde Comparar en tu horario.`)
      return
    }
    // A schedule that is already in the comparison needs no second copy: just go back to it.
    if (result.ok) writePeople(result.people)
    try {
      window.sessionStorage.setItem(
        FLASH_STORAGE_KEY,
        result.ok ? `«${owner}» se agregó a tu comparación.` : `«${owner}» ya estaba en tu comparación.`,
      )
    } catch {
      // the message is a courtesy: going back to the schedule still works without it
    }
    router.push("/")
  }

  const blocks = courses.reduce((sum, course) => sum + course.days.length, 0)
  const avatar = colorStyles(resolveColor(person.colorId).hex)
  const initial = (name.trim()[0] ?? "?").toUpperCase()

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-3 px-3 pb-28 pt-3 sm:px-5 roomy:gap-4 roomy:py-6 roomy:pb-6">
      <SkipLink target="horario" />

      <nav aria-label="Navegación" className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Logo />
          <span className="text-[15px] font-semibold tracking-tight">Sin Topes</span>
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-white/[0.07] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring roomy:h-9 roomy:px-3"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {hasOwn ? "Volver a mi horario" : "Crear el mío"}
        </Link>
      </nav>

      <header className="flex flex-col gap-3 roomy:flex-row roomy:items-center roomy:justify-between roomy:gap-6">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-full border text-base font-semibold"
            style={{ backgroundColor: avatar.background, borderColor: avatar.border, color: avatar.text }}
          >
            {initial}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold leading-tight tracking-tight">
              {name ? `Horario de ${name}` : "Horario compartido"}
            </h1>
            <p className="truncate text-[13px] text-muted-foreground">
              Solo lectura: no cambia tu horario
              <span className="hidden roomy:inline">
                {" "}
                · {courses.length} {courses.length === 1 ? "ramo" : "ramos"}, {blocks}{" "}
                {blocks === 1 ? "bloque" : "bloques"}
              </span>
            </p>
          </div>
        </div>

        {/* A bar fixed to the bottom of a phone, where the thumb is; inline from tablet width up. */}
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-border bg-background px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5 roomy:static roomy:z-auto roomy:shrink-0 roomy:border-0 roomy:bg-transparent roomy:p-0">
          {hasOwn ? (
            <Button onClick={keepComparing} className="h-11 flex-1 px-4 roomy:h-9 roomy:flex-none">
              <Users className="size-4" aria-hidden />
              Comparar en mi horario
            </Button>
          ) : (
            <Button onClick={addToMine} className="h-11 flex-1 px-4 roomy:h-9 roomy:flex-none">
              <Plus className="size-4" aria-hidden />
              Usar como mi horario
            </Button>
          )}

          <PopoverMenu
            open={menuOpen}
            onOpenChange={setMenuOpen}
            label="Más opciones"
            openUpOnPhone
            trigger={(props) => (
              <Button
                variant="outline"
                {...props}
                aria-label="Más opciones"
                title="Más opciones"
                className="size-11 px-0 roomy:h-9 roomy:w-auto roomy:px-3"
              >
                <MoreHorizontal className="size-4" aria-hidden />
                <span className="hidden roomy:inline">Más opciones</span>
              </Button>
            )}
          >
            {hasOwn ? (
              <MenuItem icon={Plus} label="Agregar sus ramos a mi horario" onSelect={addToMine} />
            ) : null}
            {hasOwn ? <MenuSeparator /> : null}
            {hasOwn ? (
              <MenuItem
                tone="destructive"
                label="Reemplazar mi horario por este"
                onSelect={() => setConfirmingReplace(true)}
              />
            ) : (
              <MenuItem label="Crear mi horario desde cero" onSelect={() => router.push("/")} />
            )}
          </PopoverMenu>
        </div>
      </header>

      {message ? (
        <p role="status" className="text-[13px] font-medium text-sky">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div role="group" aria-label="Horarios que se ven" className="flex flex-wrap items-center gap-2">
          <LayerChip
            label={theirLabel}
            on={showTheirs}
            color={resolveColor(person.colorId).hex}
            legend={both}
            locked={showTheirs && !showMine}
            onToggle={toggleTheirs}
          />
          <LayerChip
            label="Yo"
            on={showMine && hasOwn}
            color={resolveColor(PERSON_COLOR_IDS[0]).hex}
            legend={both}
            locked={showMine && !showTheirs}
            disabled={!hasOwn}
            disabledReason="Aún no tienes un horario propio"
            onToggle={toggleMine}
          />
        </div>
        <Segmented
          label="Vista"
          value={mode}
          onChange={setMode}
          className="ml-auto"
          options={[
            { value: "day", label: "Día" },
            { value: "week", label: "Semana" },
          ]}
        />
      </div>

      {!hasOwn ? (
        <p className="text-[13px] text-muted-foreground text-pretty">
          Cuando tengas tu propio horario podrás verlo junto a este y encontrar las horas en que ambos están libres.
        </p>
      ) : null}

      {both ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-muted-foreground roomy:min-h-9">
            <input
              type="checkbox"
              checked={showFree}
              onChange={(event) => setShowFree(event.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            Marcar horas libres en común
          </label>
          {showFree ? (
            <p className="text-muted-foreground">
              {bestSlot ? (
                <>
                  Mejor hueco:{" "}
                  <span className="whitespace-nowrap font-medium text-foreground">
                    {DAY_BY_ID[bestSlot.day].label} {formatMinutes(bestSlot.start)}–{formatMinutes(bestSlot.end)}
                  </span>{" "}
                  ({formatDuration(bestSlot.end - bestSlot.start)})
                </>
              ) : (
                "No hay horas libres en común en los días que se ven."
              )}
            </p>
          ) : null}
        </div>
      ) : null}

      {mode === "day" ? (
        <DayTabs selected={selectedDay} today={now?.dayId ?? null} busy={busyDays} onSelect={setSelectedDay} />
      ) : null}

      <div id="horario" tabIndex={-1} className="outline-none">
        <SwipeDays day={selectedDay} onChange={setSelectedDay} enabled={mode === "day"}>
          <ScheduleGrid
            days={days}
            courses={gridCourses}
            freeSlots={freeSlots}
            crowded={both}
            focusKey={null}
            now={now}
            readOnly
          />
        </SwipeDays>
      </div>

      <Modal
        open={confirmingReplace}
        onClose={() => setConfirmingReplace(false)}
        title="Reemplazar tu horario"
        description={`Tu horario actual se borrará y quedará solo el de ${owner}. Esto no se puede deshacer.`}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmingReplace(false)} className="h-9 px-4">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={replaceMine} className="h-9 px-4">
              Reemplazar
            </Button>
          </div>
        }
      >
        <p className="text-[13px] text-muted-foreground text-pretty">
          Si solo quieres sumar sus ramos al tuyo, usa «Agregar sus ramos a mi horario».
        </p>
      </Modal>
    </div>
  )
}

interface LayerChipProps {
  label: string
  on: boolean
  color: string
  /** The colored dot works as the legend only while both schedules share the grid. */
  legend: boolean
  /** The last visible layer cannot be switched off. */
  locked?: boolean
  disabled?: boolean
  disabledReason?: string
  onToggle: () => void
}

/** A schedule shown on the grid, switched on and off like a calendar in a calendar app. */
function LayerChip({ label, on, color, legend, locked, disabled, disabledReason, onToggle }: LayerChipProps) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-disabled={locked || undefined}
      disabled={disabled}
      title={disabled ? disabledReason : locked ? "Siempre se ve al menos un horario" : undefined}
      onClick={onToggle}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border px-3.5 text-sm transition-[background-color,border-color,color,scale] duration-150 active:scale-[0.96] roomy:h-9 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
        on ? "border-sky/50 bg-accent font-medium text-foreground" : "border-input bg-background text-muted-foreground",
        disabled && "cursor-not-allowed opacity-50 active:scale-100",
      )}
    >
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full border"
        style={legend ? { backgroundColor: color, borderColor: color } : { borderColor: "currentColor" }}
      />
      {label}
      {on ? <Check aria-hidden className="size-3.5 text-sky" /> : null}
    </button>
  )
}
