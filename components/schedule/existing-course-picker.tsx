"use client"

import { cn } from "@/lib/utils"
import { resolveColor } from "@/lib/schedule/colors"
import type { CourseGroup } from "@/lib/schedule/courses"

interface ExistingCoursePickerProps {
  groups: CourseGroup[]
  selectedTitle: string | null
  onSelect: (group: CourseGroup | null) => void
}

/**
 * Lets the user pick an existing ramo to add another time slot,
 * or start fresh with a new one.
 */
export function ExistingCoursePicker({
  groups,
  selectedTitle,
  onSelect,
}: ExistingCoursePickerProps) {
  if (groups.length === 0) return null

  const isExisting = selectedTitle !== null

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Tipo de ramo</p>
      <div className="flex gap-2">
        <ModeButton
          active={!isExisting}
          onClick={() => onSelect(null)}
          label="Nuevo ramo"
        />
        <ModeButton
          active={isExisting}
          onClick={() => onSelect(groups[0] ?? null)}
          label="Horario adicional"
        />
      </div>

      {isExisting ? (
        <div className="space-y-1.5">
          <label htmlFor="existing-course" className="text-xs text-muted-foreground">
            Selecciona el ramo
          </label>
          <select
            id="existing-course"
            value={selectedTitle ?? ""}
            onChange={(e) => {
              const group = groups.find((item) => item.title === e.target.value) ?? null
              onSelect(group)
            }}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25"
          >
            {groups.map((group) => (
              <option key={group.title} value={group.title}>
                {group.title}
              </option>
            ))}
          </select>
          {selectedTitle ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className="inline-block size-3 shrink-0 rounded-full"
                style={{ backgroundColor: resolveColor(
                  groups.find((g) => g.title === selectedTitle)?.colorId ?? "",
                ).hex }}
              />
              Se mantendrá el mismo nombre y color. Define sala y horario del nuevo bloque.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 flex-1 rounded-md border px-3 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
        active
          ? "border-sky/60 bg-accent font-medium text-foreground"
          : "border-input bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  )
}
