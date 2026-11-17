"use client"

import { ArrowLeft, Lock, MoreHorizontal, Plus, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { CompareBar } from "@/components/compare/compare-bar"
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
import { colorStyles, resolveColor } from "@/lib/schedule/colors"
import {
  bestFreeSlot,
  buildComparison,
  commonFreeSlots,
  MAX_PEOPLE,
  nextPersonColor,
  type Person,
} from "@/lib/schedule/compare"
import { DAY_BY_ID } from "@/lib/schedule/constants"
import { dayIdFromDate, weekViewDays } from "@/lib/schedule/days"
import { mergeCourses } from "@/lib/schedule/merge"
import { readPeople, withPerson, writePeople } from "@/lib/schedule/people"
import { FLASH_STORAGE_KEY, SCHEDULE_STORAGE_KEY } from "@/lib/schedule/storage-keys"
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

/** Which schedule the page shows: theirs (the link), both together, or the user's own. */
type Shown = "theirs" | "both" | "mine"

interface SharedScheduleViewProps {
  /** Id in the share link, used to avoid adding the same schedule twice. */
  shareId: string
  name: string
  courses: Course[]
}

/**
 * Page for a schedule opened from a share link.
 *
 * It opens on the other person's schedule so it is clear whose it is, and from there the
 * visitor can look at both schedules together, go back to their own, or keep the comparison.
 * Nothing here changes the visitor's data until they choose an action.
 */
export function SharedScheduleView({ shareId, name, courses }: SharedScheduleViewProps) {
  const router = useRouter()
  const { mode, setMode, selectedDay, setSelectedDay } = useViewState()
  const nowDate = useNow()
  const [shown, setShown] = useState<Shown>("theirs")
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

  const gridCourses = useMemo(
    () => (shown === "both" ? buildComparison(own, [person]) : shown === "mine" ? own : courses),
    [shown, own, person, courses],
  )

  const days = useMemo(
    () => (mode === "day" ? [DAY_BY_ID[selectedDay]] : weekViewDays(gridCourses, false)),
    [mode, selectedDay, gridCourses],
  )
  const busyDays = useMemo(() => new Set<DayId>(gridCourses.flatMap((course) => course.days)), [gridCourses])
  const freeSlots = useMemo(
    () =>
      shown === "both" && showFree
        ? commonFreeSlots([own, courses], days.map((day) => day.id).filter((id) => busyDays.has(id)))
        : undefined,
    [shown, showFree, own, courses, days, busyDays],
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
    router.push("/")
  }

  const blocks = courses.reduce((sum, course) => sum + course.days.length, 0)
  const avatar = colorStyles(resolveColor(person.colorId).hex)
  const initial = (name.trim()[0] ?? "?").toUpperCase()
  // Short enough to fit a phone-width selector next to the other two options.
  const firstName = name.trim().split(/\s+/)[0]?.slice(0, 10) ?? ""

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-4 px-3 py-4 sm:px-5 sm:py-6">
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
          className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-white/[0.07] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring roomy:h-9"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {hasOwn ? "Volver a mi horario" : "Crear el mío"}
        </Link>
      </nav>

      <section aria-label="Horario que estás viendo" className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-full border text-lg font-semibold"
            style={{ backgroundColor: avatar.background, borderColor: avatar.border, color: avatar.text }}
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold leading-tight tracking-tight text-balance">
              {name ? `Horario de ${name}` : "Horario compartido"}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                <Lock className="size-3" aria-hidden />
                Solo lectura
              </span>
              <span>
                {courses.length} {courses.length === 1 ? "ramo" : "ramos"} · {blocks}{" "}
                {blocks === 1 ? "bloque" : "bloques"}
              </span>
            </p>
          </div>
        </div>
        <p className="mt-3 text-[13px] text-muted-foreground text-pretty">
          Es una copia del momento en que lo compartieron. Mirarlo no cambia tu horario.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {hasOwn ? (
            <Button onClick={keepComparing} className="h-10 px-4 roomy:h-9">
              <Users className="size-4" aria-hidden />
              Comparar en mi horario
            </Button>
          ) : (
            <Button onClick={addToMine} className="h-10 px-4 roomy:h-9">
              <Plus className="size-4" aria-hidden />
              Usar como mi horario
            </Button>
          )}

          <PopoverMenu
            open={menuOpen}
            onOpenChange={setMenuOpen}
            label="Más opciones"
            trigger={(props) => (
              <Button
                variant="outline"
                {...props}
                aria-label="Más opciones"
                title="Más opciones"
                className="h-10 px-3 roomy:h-9"
              >
                <MoreHorizontal className="size-4" aria-hidden />
                <span className="hidden sm:inline">Más opciones</span>
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

        {hasOwn ? (
          <p className="mt-2 text-xs text-muted-foreground text-pretty">
            «Comparar en mi horario» lo suma a tus comparaciones y te lleva a tu horario.
          </p>
        ) : null}
      </section>

      {message ? (
        <p role="status" className="text-[13px] font-medium text-sky">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <span className="text-[13px] text-muted-foreground">Ver</span>
        <Segmented<Shown>
          label="Qué horario ver"
          value={shown}
          onChange={setShown}
          options={[
            {
              value: "theirs",
              label: firstName ? `Solo ${firstName}` : "Solo este",
              shortLabel: firstName || "Este",
            },
            {
              value: "both",
              label: "Ambos juntos",
              shortLabel: "Ambos",
              disabled: !hasOwn,
              disabledReason: "Crea tu horario para poder verlos juntos",
            },
            {
              value: "mine",
              label: "El mío",
              disabled: !hasOwn,
              disabledReason: "Aún no tienes un horario",
            },
          ]}
        />
        <Segmented
          label="Vista"
          value={mode}
          onChange={setMode}
          options={[
            { value: "day", label: "Día" },
            { value: "week", label: "Semana" },
          ]}
        />
        {!hasOwn ? (
          <p className="w-full text-xs text-muted-foreground text-pretty">
            Cuando tengas tu propio horario podrás verlos juntos y encontrar las horas en que ambos están libres.
          </p>
        ) : null}
      </div>

      {shown === "both" ? (
        <CompareBar
          people={[person]}
          showFree={showFree}
          onShowFreeChange={setShowFree}
          bestSlot={freeSlots ? bestFreeSlot(freeSlots) : null}
        />
      ) : shown === "mine" ? (
        <p className="text-[13px] text-muted-foreground">
          Este es tu horario. Para editarlo,{" "}
          <Link href="/" className="font-medium text-sky underline-offset-4 hover:underline">
            ve a tu horario
          </Link>
          .
        </p>
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
            crowded={shown === "both"}
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
