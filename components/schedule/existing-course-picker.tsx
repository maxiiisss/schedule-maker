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
      <p className="text-sm font-medium text-foreground">Tipo de ramo</p>
      <div className="flex flex-col gap-2 sm:flex-row">
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
          <label htmlFor="existing-course" className="text-sm text-muted-foreground">
            Selecciona el ramo
          </label>
          <select
            id="existing-course"
            value={selectedTitle ?? ""}
            onChange={(e) => {
              const group = groups.find((item) => item.title === e.target.value) ?? null
              onSelect(group)
            }}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-muted-foreground hover:bg-muted/50",
      )}
    >
      {label}
    </button>
  )
}
