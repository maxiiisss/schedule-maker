import { ImageResponse } from "next/og"

import { resolveColor } from "@/lib/schedule/colors"
import { END_HOUR, START_HOUR } from "@/lib/schedule/constants"
import { weekViewDays } from "@/lib/schedule/days"
import { layoutOverlappingBlocks } from "@/lib/schedule/layout"
import { timeToMinutes } from "@/lib/schedule/time"
import { loadShared } from "@/lib/share/load"

export const alt = "Horario compartido en ScheduleGrid"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const dynamic = "force-dynamic"

const PAD = 48
const HEADER = 96
const DAY_HEADER = 30
const GRID_HEIGHT = size.height - HEADER - DAY_HEADER - PAD

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const shared = await loadShared(id)

  const title = shared?.name ? `Horario de ${shared.name}` : "Horario compartido"
  const courses = shared?.courses ?? []
  const days = weekViewDays(courses, false)
  const columnWidth = (size.width - PAD * 2) / days.length

  // Show only the hours that are used (at least 6), so blocks stay large.
  const starts = courses.map((course) => timeToMinutes(course.start))
  const ends = courses.map((course) => timeToMinutes(course.end))
  let fromHour = starts.length ? Math.max(START_HOUR, Math.floor(Math.min(...starts) / 60)) : START_HOUR
  let toHour = ends.length ? Math.min(END_HOUR, Math.ceil(Math.max(...ends) / 60)) : END_HOUR
  if (toHour - fromHour < 6) toHour = Math.min(END_HOUR, fromHour + 6)
  if (toHour - fromHour < 6) fromHour = Math.max(START_HOUR, toHour - 6)
  const pxPerMinute = GRID_HEIGHT / ((toHour - fromHour) * 60)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#1c1c1f",
          color: "#f2f2f6",
          padding: `0 ${PAD}px ${PAD}px`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", height: HEADER, gap: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(180deg, #64d2ff, #0a84ff)",
            }}
          />
          <div style={{ display: "flex", fontSize: 38, fontWeight: 600 }}>{title}</div>
          <div style={{ display: "flex", marginLeft: "auto", fontSize: 24, color: "#a1a1ab" }}>
            ScheduleGrid
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            background: "#26262b",
            overflow: "hidden",
          }}
        >
          {days.map((day, index) => {
            const dayCourses = courses.filter((course) => course.days.includes(day.id))
            const layout = layoutOverlappingBlocks(
              dayCourses.map((course) => ({ id: course.id, start: course.start, end: course.end })),
            )

            return (
              <div
                key={day.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: columnWidth,
                  borderLeft: index === 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: DAY_HEADER,
                    fontSize: 18,
                    color: "#a1a1ab",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {day.label}
                </div>
                <div style={{ display: "flex", position: "relative", flex: 1 }}>
                  {dayCourses.map((course) => {
                    const color = resolveColor(course.colorId)
                    const place = layout.get(course.id) ?? { column: 0, totalColumns: 1 }
                    const width = (columnWidth - 8) / place.totalColumns
                    const top = (timeToMinutes(course.start) - fromHour * 60) * pxPerMinute
                    const height =
                      (timeToMinutes(course.end) - timeToMinutes(course.start)) * pxPerMinute - 3

                    return (
                      <div
                        key={course.id}
                        style={{
                          position: "absolute",
                          top,
                          left: 4 + place.column * width,
                          width: width - 3,
                          height,
                          display: "flex",
                          overflow: "hidden",
                          padding: "4px 8px",
                          borderRadius: 8,
                          borderLeft: `4px solid ${color.hex}`,
                          background: `${color.hex}40`,
                          color: "#ffffff",
                          fontSize: 16,
                          fontWeight: 600,
                        }}
                      >
                        {course.title}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    ),
    size,
  )
}
