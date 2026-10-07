"use client"

import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { COURSE_COLORS } from "@/lib/schedule/constants"

interface ColorPickerProps {
  value: string
  onChange: (colorId: string) => void
  disabled?: boolean
}

/** Swatch grid for choosing a course color. Presentation only. */
export function ColorPicker({ value, onChange, disabled = false }: ColorPickerProps) {
  return (
    <div
      role="group"
      aria-label="Color del ramo"
      className={cn("flex flex-wrap gap-2", disabled && "pointer-events-none opacity-60")}
    >
      {COURSE_COLORS.map((color) => {
        const active = value === color.id
        return (
          <button
            key={color.id}
            type="button"
            aria-pressed={active}
            aria-label={color.label}
            title={color.label}
            onClick={() => onChange(color.id)}
            style={{ backgroundColor: color.hex }}
            className={cn(
              "flex size-7 items-center justify-center rounded-full transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              active ? "ring-2 ring-sky ring-offset-2 ring-offset-popover" : "hover:scale-110",
            )}
          >
            {active ? <Check className="size-3.5 text-black/70" strokeWidth={3} /> : null}
          </button>
        )
      })}
    </div>
  )
}
