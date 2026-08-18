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
              "flex size-8 items-center justify-center rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-105",
            )}
          >
            {active ? <Check className="size-4 text-white" /> : null}
          </button>
        )
      })}
    </div>
  )
}
