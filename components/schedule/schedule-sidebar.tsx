"use client"

import { CalendarRange } from "lucide-react"

import { cn } from "@/lib/utils"
import { resolveColor } from "@/lib/schedule/colors"
import type { CourseGroup } from "@/lib/schedule/courses"
import { formatDuration, formatHoursShort } from "@/lib/schedule/time"

interface CourseListProps {
  groups: CourseGroup[]
  focusKey: string | null
  onFocus: (key: string | null) => void
}

/** App mark used in the sidebar and the compact header. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-b from-sky to-primary text-white",
        className,
      )}
    >
      <CalendarRange className="size-4" strokeWidth={2.25} />
    </span>
  )
}

/**
 * Persistent source list (desktop). Selecting a ramo spotlights its blocks
 * in the grid; selecting it again clears the spotlight.
 */
export function ScheduleSidebar({ groups, focusKey, onFocus }: CourseListProps) {
  const totalMinutes = groups.reduce((sum, group) => sum + group.minutes, 0)

  return (
    <aside
      aria-label="Resumen del horario"
      className="sticky top-0 hidden h-svh flex-col gap-5 overflow-y-auto border-r border-sidebar-border bg-sidebar px-3 pb-4 pt-5 lg:flex"
    >
      <div className="flex items-center gap-2.5 px-1.5">
        <Logo />
        <span className="text-[15px] font-semibold tracking-tight">ScheduleGrid</span>
      </div>

      <section aria-labelledby="sidebar-courses">
        <h2 id="sidebar-courses" className="px-2 pb-1.5 text-xs font-semibold text-muted-foreground/80">
          Mis ramos
        </h2>
        {groups.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground text-pretty">
            Aún no hay ramos. Agrega el primero con el botón azul.
          </p>
        ) : (
          <ul className="flex flex-col gap-px">
            {groups.map((group) => {
              const active = focusKey === group.key
              return (
                <li key={group.key}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onFocus(active ? null : group.key)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                      active ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn("size-2.5 shrink-0 rounded-full", active && "ring-2 ring-white/90")}
                      style={{ backgroundColor: resolveColor(group.colorId).hex }}
                    />
                    <span className="min-w-0 flex-1 truncate">{group.title}</span>
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        active ? "text-primary-foreground/80" : "text-muted-foreground",
                      )}
                    >
                      {formatHoursShort(group.minutes)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <div className="mt-auto rounded-xl border border-border bg-card p-3">
        <p className="text-xs text-muted-foreground">Carga semanal</p>
        <p className="my-0.5 text-2xl font-semibold tracking-tight tabular-nums">
          {formatDuration(totalMinutes)}
        </p>
        <p className="text-xs text-muted-foreground">
          {groups.length} {groups.length === 1 ? "ramo" : "ramos"}
        </p>
      </div>
    </aside>
  )
}

/** Horizontal chips with the same job as the sidebar, for tablets and phones. */
export function CourseChips({ groups, focusKey, onFocus }: CourseListProps) {
  if (groups.length === 0) return null

  return (
    <ul
      aria-label="Mis ramos"
      className="hidden gap-1.5 overflow-x-auto px-3 pb-1 pt-3 sm:flex sm:px-5 lg:hidden [scrollbar-width:none]"
    >
      {groups.map((group) => {
        const active = focusKey === group.key
        return (
          <li key={group.key} className="shrink-0">
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onFocus(active ? null : group.key)}
              className={cn(
                "flex h-8 items-center gap-2 rounded-full border px-3 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                active
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-input bg-card text-foreground hover:bg-muted",
              )}
            >
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: resolveColor(group.colorId).hex }}
              />
              {group.title}
              <span className={cn("tabular-nums", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {formatHoursShort(group.minutes)}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
