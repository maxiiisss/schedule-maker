"use client"

import { Check, Settings2, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { resolveColor } from "@/lib/schedule/colors"
import {
  formatMinutes,
  OWN_LABEL,
  PERSON_COLOR_IDS,
  type FreeSlot,
  type Person,
} from "@/lib/schedule/compare"
import { DAY_BY_ID } from "@/lib/schedule/constants"
import { formatDuration } from "@/lib/schedule/time"

interface CompareBarProps {
  people: Person[]
  showFree: boolean
  onShowFreeChange: (value: boolean) => void
  /** Longest gap when everyone is free, if any. */
  bestSlot: FreeSlot | null
  onTogglePerson: (id: string) => void
  /** Hide every other schedule: back to the user's own. */
  onHideAll: () => void
  /** Show every saved schedule again. */
  onShowAll: () => void
  /** When omitted, the "Administrar" button is not shown. */
  onManage?: () => void
}

/**
 * The strip above the grid when other schedules are saved. While comparing it says so, names
 * who is on the grid, and has one obvious way back to the user's own schedule.
 */
export function CompareBar({
  people,
  showFree,
  onShowFreeChange,
  bestSlot,
  onTogglePerson,
  onHideAll,
  onShowAll,
  onManage,
}: CompareBarProps) {
  const visible = people.filter((person) => person.visible)

  // Saved but all hidden: the grid is the user's own, with a way to bring the others back.
  if (visible.length === 0) {
    return (
      <section
        aria-label="Comparación de horarios"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card px-3.5 py-2.5"
      >
        <p className="min-w-0 flex-1 text-[13px] text-muted-foreground">
          Estás viendo solo tu horario.{" "}
          <span className="text-foreground">
            {people.length === 1 ? "Tienes 1 horario guardado" : `Tienes ${people.length} horarios guardados`}
          </span>{" "}
          para comparar.
        </p>
        <Button variant="outline" onClick={onShowAll} className="h-11 px-3.5 roomy:h-9">
          <Users className="size-4" />
          Comparar de nuevo
        </Button>
        {onManage ? <ManageButton onManage={onManage} /> : null}
      </section>
    )
  }

  const names = joinNames(visible.map((person) => person.name))

  return (
    <section
      aria-label="Comparación de horarios"
      className="flex flex-col gap-2.5 rounded-xl border border-sky/40 bg-card px-3.5 py-3"
    >
      <p className="text-[13px] text-muted-foreground">
        <span className="font-semibold text-foreground">Comparando</span> tu horario con{" "}
        <span className="font-medium text-foreground">{names}</span>
      </p>

      <ul aria-label="Horarios en la grilla" className="flex flex-wrap items-center gap-2">
        <li>
          <Chip label={OWN_LABEL} color={resolveColor(PERSON_COLOR_IDS[0]).hex} on locked />
        </li>
        {people.map((person) => (
          <li key={person.id}>
            <Chip
              label={person.name}
              color={resolveColor(person.colorId).hex}
              on={person.visible}
              onToggle={() => onTogglePerson(person.id)}
            />
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onHideAll} className="h-11 flex-1 px-3.5 roomy:h-9 roomy:flex-none">
          Volver a mi horario
        </Button>
        {onManage ? <ManageButton onManage={onManage} /> : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[13px] roomy:min-h-9">
          <input
            type="checkbox"
            checked={showFree}
            onChange={(event) => onShowFreeChange(event.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className={cn(
              "relative h-[18px] w-8 rounded-full border border-input transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
              showFree ? "bg-primary" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-3 rounded-full bg-white transition-[left]",
                showFree ? "left-[17px]" : "left-0.5",
              )}
            />
          </span>
          Marcar horas libres de todos
        </label>

        {showFree ? (
          <p className="min-w-0 text-[13px] text-muted-foreground">
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
    </section>
  )
}

function ManageButton({ onManage }: { onManage: () => void }) {
  return (
    <Button variant="ghost" onClick={onManage} className="h-11 px-2.5 roomy:h-9">
      <Settings2 className="size-4" />
      Administrar
    </Button>
  )
}

/** "Ana", "Ana y Luis", "Ana, Luis y Sofía". */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ""
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`
}

interface ChipProps {
  label: string
  color: string
  on: boolean
  locked?: boolean
  onToggle?: () => void
}

/** A schedule on the grid: its color, and a switch to show or hide it. */
function Chip({ label, color, on, locked, onToggle }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-disabled={locked || undefined}
      title={locked ? "Tu horario siempre se ve" : undefined}
      onClick={locked ? undefined : onToggle}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border px-3.5 text-sm transition-[background-color,border-color,color,scale] duration-150 active:scale-[0.96] roomy:h-9 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
        on ? "border-sky/50 bg-accent font-medium text-foreground" : "border-input bg-background text-muted-foreground",
        locked && "cursor-default active:scale-100",
      )}
    >
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full border"
        style={on ? { backgroundColor: color, borderColor: color } : { borderColor: color }}
      />
      {label}
      {on ? <Check aria-hidden className="size-3.5 text-sky" /> : null}
    </button>
  )
}
