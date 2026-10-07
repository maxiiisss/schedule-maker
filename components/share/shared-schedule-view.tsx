"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { DayTabs } from "@/components/schedule/day-tabs"
import { ScheduleGrid, type NowMarker } from "@/components/schedule/schedule-grid"
import { Logo } from "@/components/schedule/schedule-sidebar"
import { Segmented } from "@/components/schedule/segmented"
import { Button } from "@/components/ui/button"
import { useNow } from "@/hooks/use-now"
import { useViewState } from "@/hooks/use-view-state"
import { DAY_BY_ID } from "@/lib/schedule/constants"
import { MAX_PEOPLE } from "@/lib/schedule/compare"
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

interface SharedScheduleViewProps {
  /** Id in the share link, used to avoid adding the same schedule twice. */
  shareId: string
  name: string
  courses: Course[]
}

/** Read-only page for a schedule opened from a share link. */
export function SharedScheduleView({ shareId, name, courses }: SharedScheduleViewProps) {
  const router = useRouter()
  const { mode, setMode, selectedDay, setSelectedDay } = useViewState()
  const nowDate = useNow()
  const [confirming, setConfirming] = useState(false)
  const [compareMessage, setCompareMessage] = useState<string | null>(null)
  const [hasOwn, setHasOwn] = useState(false)

  // Read after mount so the server and client markup match.
  useEffect(() => {
    setHasOwn(readOwnCourses().length > 0)
  }, [])

  const days = useMemo(
    () => (mode === "day" ? [DAY_BY_ID[selectedDay]] : weekViewDays(courses, false)),
    [mode, selectedDay, courses],
  )
  const busyDays = useMemo(() => new Set<DayId>(courses.flatMap((course) => course.days)), [courses])
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
      setCompareMessage("No se pudo guardar en este navegador. Revisa que el almacenamiento esté permitido.")
      return
    }
    router.push("/")
  }

  /** Replace the user's schedule with this one, after confirming. */
  const replaceMine = () => {
    if (hasOwn && !confirming) {
      setConfirming(true)
      return
    }
    try {
      window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(courses))
      window.sessionStorage.setItem(FLASH_STORAGE_KEY, "Tu horario fue reemplazado.")
    } catch {
      setCompareMessage("No se pudo guardar en este navegador. Revisa que el almacenamiento esté permitido.")
      return
    }
    router.push("/")
  }

  const addToCompare = () => {
    const result = withPerson(readPeople(), { name, courses, sourceId: shareId })
    if (!result.ok) {
      setCompareMessage(
        result.reason === "duplicate"
          ? "Ya agregaste este horario para comparar."
          : `Puedes comparar hasta ${MAX_PEOPLE} horarios a la vez. Quita uno desde Comparar.`,
      )
      return
    }
    writePeople(result.people)
    router.push("/")
  }

  const title = name || "Horario compartido"
  const blocks = courses.reduce((sum, course) => sum + course.days.length, 0)

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-3 px-3 py-4 sm:px-5 sm:py-6">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <Logo />
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold leading-tight tracking-tight">{title}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {courses.length} {courses.length === 1 ? "ramo" : "ramos"} · {blocks}{" "}
              {blocks === 1 ? "bloque" : "bloques"} · solo lectura
            </p>
          </div>
        </div>

        <Segmented
          label="Vista"
          value={mode}
          onChange={setMode}
          options={[
            { value: "day", label: "Día" },
            { value: "week", label: "Semana" },
          ]}
        />

        <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
          {confirming ? (
            <>
              <span className="hidden text-[13px] text-muted-foreground sm:inline">
                Reemplazará tu horario actual.
              </span>
              <Button variant="ghost" onClick={() => setConfirming(false)} className="h-9 px-3">
                Cancelar
              </Button>
              <Button onClick={replaceMine} className="h-9 px-3.5">
                Reemplazar
              </Button>
            </>
          ) : (
            <>
              <Button onClick={addToMine} className="h-9 px-3.5">
                Agregar a mi horario
              </Button>
              <Button variant="outline" onClick={addToCompare} className="h-9 px-3.5">
                Comparar con el mío
              </Button>
              {hasOwn ? (
                <Button variant="ghost" onClick={replaceMine} className="h-9 px-3">
                  Reemplazar el mío
                </Button>
              ) : null}
              <Link
                href="/"
                className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-white/[0.07] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {hasOwn ? "Ir a mi horario" : "Crear el mío"}
              </Link>
            </>
          )}
        </div>
      </header>

      {compareMessage ? (
        <p role="status" className="text-[13px] font-medium text-sky">
          {compareMessage}
        </p>
      ) : null}

      {mode === "day" ? (
        <DayTabs selected={selectedDay} today={now?.dayId ?? null} busy={busyDays} onSelect={setSelectedDay} />
      ) : null}

      <ScheduleGrid days={days} courses={courses} focusKey={null} now={now} readOnly />
    </div>
  )
}
