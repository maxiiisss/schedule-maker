"use client"

import { cn } from "@/lib/utils"

interface SegmentedOption<T extends string> {
  value: T
  label: string
  /** Shorter label for narrow screens. */
  shortLabel?: string
  disabled?: boolean
}

interface SegmentedProps<T extends string> {
  value: T
  options: SegmentedOption<T>[]
  onChange: (value: T) => void
  label: string
  className?: string
}

/** Compact segmented control (macOS style) for switching between a few options. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex rounded-lg border border-border bg-card p-0.5", className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={option.disabled}
            title={option.disabled ? "Hay ramos en fin de semana" : undefined}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-7 rounded-md px-3 text-[13px] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
              active
                ? "bg-[#3a3a42] font-medium text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.4),inset_0_0_0_1px_rgb(255_255_255/0.1)]"
                : "text-muted-foreground hover:text-foreground",
              option.disabled && "pointer-events-auto cursor-not-allowed opacity-40 hover:text-muted-foreground",
            )}
          >
            {option.shortLabel ? (
              <>
                <span className="sm:hidden">{option.shortLabel}</span>
                <span className="hidden sm:inline">{option.label}</span>
              </>
            ) : (
              option.label
            )}
          </button>
        )
      })}
    </div>
  )
}
