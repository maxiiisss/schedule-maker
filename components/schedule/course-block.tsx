"use client"

import { MapPin, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { colorStyles, resolveColor } from "@/lib/schedule/colors"
import type { BlockLayout } from "@/lib/schedule/layout"
import { heightForRange, offsetForTime } from "@/lib/schedule/time"
import type { Course } from "@/lib/schedule/types"

interface CourseBlockProps {
  course: Course
  dayLabel: string
  layout: BlockLayout
  /** "dimmed" fades the block while another ramo is spotlighted. */
  state: "normal" | "focused" | "dimmed"
  onEdit?: (course: Course) => void
  onDelete?: (id: string) => void
  /** Shared schedules are view-only: no editing and no delete button. */
  readOnly?: boolean
}

const HORIZONTAL_INSET = 3

/**
 * A single course rendered as an absolutely-positioned block inside a day
 * column. Position and height come from times; width/column from overlap layout.
 */
export function CourseBlock({
  course,
  dayLabel,
  layout,
  state,
  onEdit,
  onDelete,
  readOnly = false,
}: CourseBlockProps) {
  const color = resolveColor(course.colorId)
  const styles = colorStyles(color.hex)
  const top = offsetForTime(course.start)
  const height = heightForRange(course.start, course.end)
  const showTime = height >= 46
  const showRoom = height >= 62 && course.room

  const columnWidth = 100 / layout.totalColumns
  const left = `calc(${layout.column * columnWidth}% + ${HORIZONTAL_INSET}px)`
  const width = `calc(${columnWidth}% - ${HORIZONTAL_INSET * 2}px)`

  return (
    <div
      role={readOnly ? "group" : "button"}
      tabIndex={readOnly ? undefined : 0}
      aria-label={`${course.title}, ${dayLabel} de ${course.start} a ${course.end}${course.room ? `, ${course.room}` : ""}${readOnly ? "" : ". Editar"}`}
      onClick={readOnly ? undefined : () => onEdit?.(course)}
      onKeyDown={
        readOnly
          ? undefined
          : (e) => {
              if (e.target !== e.currentTarget) return
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onEdit?.(course)
              }
            }
      }
      style={{
        top: top + 1,
        left,
        width,
        height: Math.max(height - 3, 22),
        backgroundColor: styles.background,
        borderColor: styles.border,
        borderLeftColor: styles.accent,
        color: styles.text,
      }}
      className={cn(
        "group absolute flex flex-col gap-0.5 overflow-hidden rounded-md border border-l-[3px] px-2 py-1 text-left transition-[filter,opacity] hover:z-20 hover:brightness-125 focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
        state === "dimmed" && "opacity-25",
        state === "focused" && "ring-1 ring-white/50",
      )}
    >
      <p className="truncate pr-4 text-[12.5px] font-semibold leading-tight" title={course.title}>
        {course.title}
      </p>

      {showTime ? (
        <p className="truncate text-[11.5px] leading-tight tabular-nums opacity-80">
          {course.start} – {course.end}
        </p>
      ) : null}
      {showRoom ? (
        <p className="flex items-center gap-1 truncate text-[11.5px] leading-tight opacity-80">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{course.room}</span>
        </p>
      ) : null}

      {readOnly ? null : (
        <button
          type="button"
          aria-label={`Eliminar ${course.title}`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.(course.id)
          }}
          className="absolute right-1 top-1 hidden size-[18px] place-items-center rounded bg-black/40 text-white transition-colors hover:bg-destructive focus-visible:outline-2 focus-visible:outline-ring group-focus-within:grid [@media(hover:hover)]:group-hover:grid"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  )
}
