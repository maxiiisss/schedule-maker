"use client"

import type { LucideIcon } from "lucide-react"
import { HardDriveDownload, Share2, Trash2, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { resolveColor } from "@/lib/schedule/colors"
import type { CourseGroup } from "@/lib/schedule/courses"
import { formatDuration, formatHoursShort } from "@/lib/schedule/time"
import { Drawer } from "./drawer"
import { Logo } from "./schedule-sidebar"

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  groups: CourseGroup[]
  focusKey: string | null
  onFocus: (key: string | null) => void
  /** Week view includes Saturday and Sunday. */
  includeWeekend: boolean
  /** A course already sits on the weekend, so it cannot be hidden. */
  weekendLocked: boolean
  onIncludeWeekend: (value: boolean) => void
  /** People being compared right now. */
  comparing: number
  hasCourses: boolean
  onSave: () => void
  onCompare: () => void
  onShare: () => void
  onClear: () => void
}

/** Everything that is not needed on every visit, behind the three-line button. */
export function MobileMenu({
  open,
  onClose,
  groups,
  focusKey,
  onFocus,
  includeWeekend,
  weekendLocked,
  onIncludeWeekend,
  comparing,
  hasCourses,
  onSave,
  onCompare,
  onShare,
  onClear,
}: MobileMenuProps) {
  const totalMinutes = groups.reduce((sum, group) => sum + group.minutes, 0)

  /** Close the menu first, then run the action (so a dialog does not open behind it). */
  const run = (action: () => void) => () => {
    onClose()
    action()
  }

  return (
    <Drawer open={open} onClose={onClose} label="Menú">
      <div className="flex items-center gap-2.5 px-4 pb-4">
        <Logo />
        <span className="text-[17px] font-semibold tracking-tight">ScheduleGrid</span>
      </div>

      <section aria-labelledby="menu-courses" className="px-2 pb-3">
        <div className="flex items-baseline justify-between px-2 pb-1.5">
          <h2 id="menu-courses" className="text-xs font-semibold text-muted-foreground/80">
            Mis ramos
          </h2>
          {hasCourses ? (
            <span className="text-xs tabular-nums text-muted-foreground">{formatDuration(totalMinutes)} a la semana</span>
          ) : null}
        </div>

        {groups.length === 0 ? (
          <p className="px-2 text-[13px] text-muted-foreground text-pretty">
            Aún no hay ramos. Agrega el primero con el botón +.
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
                    onClick={() => {
                      onFocus(active ? null : group.key)
                      onClose()
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[15px] transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                      active ? "bg-primary text-primary-foreground" : "active:bg-white/[0.06]",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn("size-3 shrink-0 rounded-full", active && "ring-2 ring-white/90")}
                      style={{ backgroundColor: resolveColor(group.colorId).hex }}
                    />
                    <span className="min-w-0 flex-1 truncate">{group.title}</span>
                    <span
                      className={cn(
                        "text-[13px] tabular-nums",
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
        {focusKey ? (
          <p className="px-2.5 pt-1.5 text-xs text-muted-foreground">
            Tocar el ramo resaltado otra vez quita el resalte.
          </p>
        ) : null}
      </section>

      <div className="mx-4 border-t border-border" />

      <section aria-labelledby="menu-view" className="px-2 py-3">
        <h2 id="menu-view" className="px-2 pb-1.5 text-xs font-semibold text-muted-foreground/80">
          Vista
        </h2>
        <label
          className={cn(
            "flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-[15px]",
            weekendLocked ? "opacity-60" : "active:bg-white/[0.06]",
          )}
        >
          <span className="min-w-0 flex-1">
            Mostrar sábado y domingo
            <span className="block text-xs text-muted-foreground">
              {weekendLocked ? "Hay ramos en fin de semana." : "En la vista semana."}
            </span>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={includeWeekend || weekendLocked}
            disabled={weekendLocked}
            onChange={(event) => onIncludeWeekend(event.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className={cn(
              "relative h-6 w-10 shrink-0 rounded-full border border-input transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
              includeWeekend || weekendLocked ? "bg-primary" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-4 rounded-full bg-white transition-all",
                includeWeekend || weekendLocked ? "left-[19px]" : "left-0.5",
              )}
            />
          </span>
        </label>
      </section>

      <div className="mx-4 border-t border-border" />

      <section aria-label="Opciones del horario" className="px-2 pt-3">
        <ul className="flex flex-col gap-px">
          <MenuRow icon={HardDriveDownload} label="Guardar y respaldo" hint="Captura, copia y restaurar" onClick={run(onSave)} />
          <MenuRow
            icon={Users}
            label="Comparar horarios"
            hint={comparing > 0 ? `${comparing} en la comparación` : "Con amigos o compañeros"}
            onClick={run(onCompare)}
            accent
          />
          <MenuRow icon={Share2} label="Compartir enlace" hint="Para enviar por WhatsApp" onClick={run(onShare)} accent />
          {hasCourses ? (
            <MenuRow icon={Trash2} label="Limpiar horario" hint="Borra todos tus ramos" onClick={run(onClear)} danger />
          ) : null}
        </ul>
      </section>
    </Drawer>
  )
}

function MenuRow({
  icon: Icon,
  label,
  hint,
  onClick,
  accent,
  danger,
}: {
  icon: LucideIcon
  label: string
  hint: string
  onClick: () => void
  accent?: boolean
  danger?: boolean
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors active:bg-white/[0.06] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <Icon
          className={cn("size-5 shrink-0", danger ? "text-destructive" : accent ? "text-sky" : "text-muted-foreground")}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className={cn("block text-[15px]", danger && "text-destructive")}>{label}</span>
          <span className="block truncate text-xs text-muted-foreground">{hint}</span>
        </span>
      </button>
    </li>
  )
}
