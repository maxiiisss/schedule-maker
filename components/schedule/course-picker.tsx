"use client"

import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { resolveColor } from "@/lib/schedule/colors"
import { DAY_BY_ID } from "@/lib/schedule/constants"
import type { CourseGroup, CourseSlot } from "@/lib/schedule/courses"

interface CoursePickerProps {
  groups: CourseGroup[]
  /** Key of the selected ramo, or null for "new ramo". */
  selectedKey: string | null
  onSelect: (group: CourseGroup | null) => void
}

/**
 * Chips with every ramo already on the schedule, plus "Nuevo ramo".
 * Picking an existing ramo means "add another time slot to it".
 */
export function CoursePicker({ groups, selectedKey, onSelect }: CoursePickerProps) {
  if (groups.length === 0) return null

  return (
    <div className="space-y-2">
      <p id="course-picker-label" className="text-xs text-muted-foreground">
        ¿A qué ramo pertenece?
      </p>
      <div
        role="radiogroup"
        aria-labelledby="course-picker-label"
        className="-mx-1 flex max-h-[7.5rem] flex-wrap gap-1.5 overflow-y-auto px-1 py-1"
      >
        <Chip checked={selectedKey === null} onClick={() => onSelect(null)}>
          <Plus className="size-3.5" aria-hidden />
          Nuevo ramo
        </Chip>
        {groups.map((group) => (
          <Chip
            key={group.key}
            checked={selectedKey === group.key}
            onClick={() => onSelect(group)}
          >
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: resolveColor(group.colorId).hex }}
            />
            <span className="max-w-[16ch] truncate">{group.title}</span>
          </Chip>
        ))}
      </div>
    </div>
  )
}

function Chip({
  checked,
  onClick,
  children,
}: {
  checked: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
        checked
          ? "border-sky/60 bg-accent font-medium text-foreground"
          : "border-input bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

/** "Lun · Mié" style label for the days of a slot. */
export function formatSlotDays(slot: CourseSlot): string {
  return slot.days.map((id) => DAY_BY_ID[id].short).join(" · ")
}

interface SlotSummaryProps {
  group: CourseGroup
}

/** Lists the time slots a ramo already has, so the new one is easy to place. */
export function SlotSummary({ group }: SlotSummaryProps) {
  return (
    <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5">
      <p className="mb-1.5 flex items-center gap-2 text-xs text-muted-foreground">
        <span
          aria-hidden
          className="size-2 rounded-full"
          style={{ backgroundColor: resolveColor(group.colorId).hex }}
        />
        Horarios que ya tiene {group.title}
      </p>
      <ul className="space-y-1">
        {group.slots.map((slot, index) => (
          <li key={index} className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
            <span className="font-medium">{formatSlotDays(slot)}</span>
            <span className="tabular-nums text-muted-foreground">
              {slot.start} – {slot.end}
            </span>
            {slot.room ? <span className="text-muted-foreground">· {slot.room}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
