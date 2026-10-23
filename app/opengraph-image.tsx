import { ImageResponse } from "next/og"

export const alt = "ScheduleGrid: tu horario de la semana en una grilla"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** Preview card for the home page (link previews in WhatsApp, Slack, social networks). */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 28,
          padding: "0 96px",
          background: "#1c1c1f",
          color: "#f2f2f6",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: 28,
              background: "linear-gradient(180deg, #64d2ff, #0a84ff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 58,
                border: "7px solid #ffffff",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 38, height: 11, borderRadius: 6, background: "#ffffff" }} />
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>ScheduleGrid</div>
        </div>
        <div style={{ display: "flex", fontSize: 44, color: "#a1a1ab", maxWidth: 900 }}>
          Tu horario de la semana en una grilla. Compártelo y compáralo con tus compañeros.
        </div>
      </div>
    ),
    size,
  )
}
