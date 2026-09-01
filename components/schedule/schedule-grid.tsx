"use client"

import type { RefObject } from "react"
import { useMemo } from "react"

import { cn } from "@/lib/utils"
import { HOUR_HEIGHT } from "@/lib/schedule/constants"
import { layoutOverlappingBlocks } from "@/lib/schedule/layout"
import { gridBodyHeight, generateHourLabels } from "@/lib/schedule/time"
import type { Course, Day } from "@/lib/schedule/types"
import { CourseBlock } from "./course-block"

interface ScheduleGridProps {
  days: Day[]
  courses: Course[]
  onEditCourse: (course: Course) => void
  onDeleteCourse: (id: string) => void
  gridRef?: RefObject<HTMLDivElement | null>
}

const HOUR_LABELS = generateHourLabels()

/**
 * Renders the dynamic timetable: an hour axis on the left and one column per
 * visible day. Course blocks are positioned within each day column.
 */
export function ScheduleGrid({ days, courses, onEditCourse, onDeleteCourse, gridRef }: ScheduleGridProps) {
  const bodyHeight = gridBodyHeight()

  const layoutByDay = useMemo(() => {
    const map = new Map<string, Map<string, { column: number; totalColumns: number }>>()

    for (const day of days) {
      const dayCourses = courses.filter((course) => course.days.includes(day.id))
      const blocks = dayCourses.map((course) => ({
        id: course.id,
        start: course.start,
        end: course.end,
      }))
      map.set(day.id, layoutOverlappingBlocks(blocks))
    }

    return map
  }, [days, courses])

  return (
    <div ref={gridRef} className="overflow-x-auto rounded-xl border border-border bg-card">
      {/* min-width keeps columns usable on mobile via horizontal scroll */}
      <div className="min-w-[640px]">
        {/* Header row: day labels */}
        <div className="flex border-b border-border bg-muted/40">
          <div className="w-14 shrink-0 sm:w-16" aria-hidden />
          {days.map((day) => (
            <div
              key={day.id}
              className={cn(
                "flex-1 border-l border-border px-2 py-3 text-center",
                day.weekend && "bg-accent/40",
              )}
            >
              <p className="font-heading text-sm font-semibold text-foreground">{day.label}</p>
            </div>
          ))}
        </div>

        {/* Body: hour axis + day columns */}
        <div className="flex">
          {/* Y axis */}
          <div className="w-14 shrink-0 sm:w-16" style={{ height: bodyHeight }}>
            {HOUR_LABELS.slice(0, -1).map((label) => (
              <div
                key={label}
                style={{ height: HOUR_HEIGHT }}
                className="relative border-b border-border/60"
              >
                <span className="absolute -top-2 right-2 text-[11px] font-medium tabular-nums text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayCourses = courses.filter((course) => course.days.includes(day.id))
            const dayLayout = layoutByDay.get(day.id) ?? new Map()

            return (
              <div
                key={day.id}
                className={cn(
                  "relative flex-1 border-l border-border",
                  day.weekend && "bg-accent/20",
                )}
                style={{ height: bodyHeight }}
              >
                {/* Hour gridlines */}
                {HOUR_LABELS.slice(0, -1).map((label) => (
                  <div
                    key={label}
                    style={{ height: HOUR_HEIGHT }}
                    className="border-b border-border/60"
                  />
                ))}

                {/* Course blocks */}
                {dayCourses.map((course) => (
                  <CourseBlock
                    key={`${day.id}-${course.id}`}
                    course={course}
                    layout={dayLayout.get(course.id) ?? { column: 0, totalColumns: 1 }}
                    onEdit={onEditCourse}
                    onDelete={onDeleteCourse}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
