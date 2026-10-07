"use client"

import { Settings2 } from "lucide-react"

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
  onManage: () => void
}

/** Legend and controls shown above the grid while schedules are being compared. */
export function CompareBar({ people, showFree, onShowFreeChange, bestSlot, onManage }: CompareBarProps) {
  const visible = people.filter((person) => person.visible)

  return (
    <section
      aria-label="Comparación de horarios"
      className="flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5"
    >
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Legend colorId={PERSON_COLOR_IDS[0]} name={OWN_LABEL} />
        {visible.map((person) => (
          <Legend key={person.id} colorId={person.colorId} name={person.name} />
        ))}
      </ul>

      <label className="flex cursor-pointer items-center gap-2 text-[13px]">
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
              "absolute top-0.5 size-3 rounded-full bg-white transition-all",
              showFree ? "left-[17px]" : "left-0.5",
            )}
          />
        </span>
        Mostrar horas libres en común
      </label>

      <p className="w-full min-w-0 text-[13px] text-muted-foreground sm:w-auto sm:flex-1">
        {showFree ? (
          bestSlot ? (
            <>
              Mejor hueco:{" "}
              <span className="whitespace-nowrap font-medium text-foreground">
                {DAY_BY_ID[bestSlot.day].label} {formatMinutes(bestSlot.start)}–{formatMinutes(bestSlot.end)}
              </span>{" "}
              ({formatDuration(bestSlot.end - bestSlot.start)})
            </>
          ) : (
            "No hay horas libres en común en los días que se ven."
          )
        ) : null}
      </p>

      <Button variant="ghost" onClick={onManage} className="h-8 px-2.5">
        <Settings2 className="size-4" />
        Administrar
      </Button>
    </section>
  )
}

function Legend({ colorId, name }: { colorId: string; name: string }) {
  return (
    <li className="flex items-center gap-1.5 text-[13px]">
      <span
        aria-hidden
        className="size-2.5 rounded-full"
        style={{ backgroundColor: resolveColor(colorId).hex }}
      />
      {name}
    </li>
  )
}
