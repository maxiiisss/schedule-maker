"use client"

import type { RefObject } from "react"
import { useMemo } from "react"

import { cn } from "@/lib/utils"
import { END_HOUR, HOUR_HEIGHT, START_HOUR } from "@/lib/schedule/constants"
import { layoutOverlappingBlocks } from "@/lib/schedule/layout"
import { generateHourLabels, gridBodyHeight } from "@/lib/schedule/time"
import type { FreeSlot, GridCourse } from "@/lib/schedule/compare"
import type { Course, Day, DayId } from "@/lib/schedule/types"
import { CourseBlock } from "./course-block"

/** Where "now" falls on the grid, when it is inside the visible hours. */
export interface NowMarker {
  dayId: DayId
  minutes: number
  date: number
}

interface ScheduleGridProps {
  days: Day[]
  courses: GridCourse[]
  /** Stretches when everyone being compared is free; drawn behind the blocks. */
  freeSlots?: FreeSlot[]
  /** Several schedules overlaid: columns get wider and the grid scrolls sideways if needed. */
  crowded?: boolean
  /** Lower-cased ramo title to spotlight; other blocks are dimmed. */
  focusKey: string | null
  now: NowMarker | null
  onEditCourse?: (course: Course) => void
  onDeleteCourse?: (id: string) => void
  /** View-only rendering, used for shared schedules. */
  readOnly?: boolean
  gridRef?: RefObject<HTMLDivElement | null>
}

const HOUR_LABELS = generateHourLabels().slice(0, -1)
const AXIS_WIDTH = 52
/** Narrowest a day column may get before the grid scrolls sideways. */
const MIN_COLUMN_WIDTH = 112
const MIN_CROWDED_COLUMN_WIDTH = 176

/**
 * Timetable: an hour axis on the left and one column per visible day.
 * Handles both the week view (many columns) and the day view (one column).
 */
export function ScheduleGrid({
  days,
  courses,
  freeSlots,
  crowded = false,
  focusKey,
  now,
  onEditCourse,
  onDeleteCourse,
  readOnly = false,
  gridRef,
}: ScheduleGridProps) {
  const bodyHeight = gridBodyHeight()
  const columns = `${AXIS_WIDTH}px repeat(${days.length}, minmax(0, 1fr))`

  const nowOffset =
    now && now.minutes >= START_HOUR * 60 && now.minutes < END_HOUR * 60
      ? ((now.minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT
      : null

  const layoutByDay = useMemo(() => {
    const map = new Map<string, Map<string, { column: number; totalColumns: number }>>()
    for (const day of days) {
      const blocks = courses
        .filter((course) => course.days.includes(day.id))
        .map((course) => ({ id: course.id, start: course.start, end: course.end }))
      map.set(day.id, layoutOverlappingBlocks(blocks))
    }
    return map
  }, [days, courses])

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto overscroll-x-contain">
        {/* The ref sits on the full-width content so image capture includes every column. */}
        <div
          ref={gridRef}
          className="bg-card"
          style={{
            minWidth:
              AXIS_WIDTH +
              days.length * (days.length > 1 ? (crowded ? MIN_CROWDED_COLUMN_WIDTH : MIN_COLUMN_WIDTH) : 0),
          }}
        >
          <div
            className="grid border-b border-border bg-white/[0.025]"
            style={{ gridTemplateColumns: columns }}
          >
            <div aria-hidden />
            {days.map((day) => {
              const isToday = now?.dayId === day.id
              return (
                <div
                  key={day.id}
                  className={cn(
                    "flex items-center justify-center gap-1.5 border-l border-border px-1 py-2.5 text-[13px]",
                    isToday ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span>{day.label}</span>
                  {isToday && now ? (
                    <span
                      aria-label="hoy"
                      className="grid h-[22px] min-w-[22px] place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground"
                    >
                      {now.date}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className="relative grid" style={{ gridTemplateColumns: columns, height: bodyHeight }}>
            <div aria-hidden>
              {HOUR_LABELS.map((label, index) => (
                <div key={label} style={{ height: HOUR_HEIGHT }} className="relative">
                  {index > 0 ? (
                    <span className="absolute -top-[7px] right-2 text-[11px] tabular-nums text-muted-foreground/80">
                      {label}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            {days.map((day) => {
              const dayCourses = courses.filter((course) => course.days.includes(day.id))
              const dayLayout = layoutByDay.get(day.id)
              const isToday = now?.dayId === day.id

              return (
                <div
                  key={day.id}
                  className={cn(
                    "relative border-l border-border",
                    day.weekend && "bg-white/[0.015]",
                    isToday && "bg-primary/[0.06]",
                  )}
                  style={{
                    backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px)",
                    backgroundSize: `100% ${HOUR_HEIGHT}px`,
                  }}
                >
                  {freeSlots
                    ?.filter((slot) => slot.day === day.id)
                    .map((slot) => {
                      const top = ((slot.start - START_HOUR * 60) / 60) * HOUR_HEIGHT
                      const height = ((slot.end - slot.start) / 60) * HOUR_HEIGHT
                      return (
                        <div
                          key={`free-${slot.start}`}
                          aria-hidden
                          className="pointer-events-none absolute inset-x-1 rounded-md border border-dashed border-sky/40 bg-sky/[0.09] px-2 py-1 text-[11px] font-medium text-sky/90"
                          style={{ top: top + 1, height: height - 2 }}
                        >
                          {height >= 28 ? "Libres" : null}
                        </div>
                      )
                    })}

                  {dayCourses.map((course) => (
                    <CourseBlock
                      key={`${day.id}-${course.id}`}
                      course={course}
                      dayLabel={day.label}
                      layout={dayLayout?.get(course.id) ?? { column: 0, totalColumns: 1 }}
                      state={
                        focusKey === null
                          ? "normal"
                          : course.title.trim().toLowerCase() === focusKey
                            ? "focused"
                            : "dimmed"
                      }
                      onEdit={onEditCourse}
                      onDelete={onDeleteCourse}
                      readOnly={readOnly}
                    />
                  ))}

                  {isToday && nowOffset !== null && now ? (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 z-10 border-t-[1.5px] border-sky"
                      style={{ top: nowOffset }}
                    >
                      <span className="absolute -left-[5px] -top-[5.5px] size-[9px] rounded-full bg-sky" />
                    </div>
                  ) : null}
                </div>
              )
            })}

            {nowOffset !== null && now ? (
              <span
                aria-hidden
                className="pointer-events-none absolute left-0.5 z-10 rounded bg-sky px-1 text-[10.5px] font-semibold leading-4 text-[#06222e] tabular-nums"
                style={{ top: nowOffset - 8 }}
              >
                {String(Math.floor(now.minutes / 60)).padStart(2, "0")}:{String(now.minutes % 60).padStart(2, "0")}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
