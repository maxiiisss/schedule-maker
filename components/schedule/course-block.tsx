"use client"

import { MapPin, Trash2 } from "lucide-react"

import { colorStyles, resolveColor } from "@/lib/schedule/colors"
import type { BlockLayout } from "@/lib/schedule/layout"
import { heightForRange, offsetForTime } from "@/lib/schedule/time"
import type { Course } from "@/lib/schedule/types"

interface CourseBlockProps {
  course: Course
  layout: BlockLayout
  onEdit: (course: Course) => void
  onDelete: (id: string) => void
}

const HORIZONTAL_INSET = 4

/**
 * A single course rendered as an absolutely-positioned block inside a day
 * column. Position and height come from times; width/column from overlap layout.
 */
export function CourseBlock({ course, layout, onEdit, onDelete }: CourseBlockProps) {
  const color = resolveColor(course.colorId)
  const styles = colorStyles(color.hex)
  const top = offsetForTime(course.start)
  const height = heightForRange(course.start, course.end)
  const compact = height < 52

  const columnWidth = 100 / layout.totalColumns
  const left = `calc(${layout.column * columnWidth}% + ${HORIZONTAL_INSET}px)`
  const width = `calc(${columnWidth}% - ${HORIZONTAL_INSET * 2}px)`

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(course)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onEdit(course)
        }
      }}
      style={{
        top,
        left,
        width,
        height: Math.max(height - 4, 22),
        backgroundColor: styles.background,
        borderColor: styles.border,
        borderLeftColor: styles.accent,
      }}
      className="group absolute flex flex-col gap-0.5 overflow-hidden rounded-md border border-l-4 px-1.5 py-1.5 text-left transition-shadow hover:z-10 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-2"
    >
      <div className="flex items-start justify-between gap-1">
        <p className="truncate text-xs font-semibold leading-tight text-foreground" title={course.title}>
          {course.title}
        </p>
        <button
          type="button"
          aria-label={`Eliminar ${course.title}`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete(course.id)
          }}
          className="hidden shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-background/60 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:block"
        >
          <Trash2 className="size-3" />
        </button>
      </div>

      {!compact ? (
        <>
          <p className="text-[11px] font-medium leading-none text-muted-foreground">
            {course.start} – {course.end}
          </p>
          {course.room ? (
            <p className="flex items-center gap-1 truncate text-[11px] leading-none text-muted-foreground">
              <MapPin className="size-3 shrink-0" style={{ color: styles.accent }} />
              <span className="truncate">{course.room}</span>
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
