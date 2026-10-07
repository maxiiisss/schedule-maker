"use client"

import type { LucideIcon } from "lucide-react"
import { Check } from "lucide-react"
import { createContext, useContext, useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

interface TriggerProps {
  ref: React.RefObject<HTMLButtonElement | null>
  onClick: () => void
  "aria-haspopup": "menu"
  "aria-expanded": boolean
}

interface PopoverMenuProps {
  /** Controlled by the parent so only one menu is open at a time. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Accessible name of the menu. */
  label: string
  /** Renders the button that opens the menu. Spread `props` onto it. */
  trigger: (props: TriggerProps) => React.ReactNode
  children: React.ReactNode
  className?: string
}

const CloseContext = createContext<() => void>(() => {})

/**
 * Small dropdown anchored under its trigger (to the right edge).
 *
 * Closes on outside tap, Escape, Tab and after choosing an item. Arrow keys
 * move between items. The panel never grows taller than the screen or wider
 * than the viewport, so it fits a 360 px phone.
 */
export function PopoverMenu({ open, onOpenChange, label, trigger, children, className }: PopoverMenuProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const items = () =>
      Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])') ?? [])

    const frame = requestAnimationFrame(() => items()[0]?.focus())

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) onOpenChange(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onOpenChange(false)
        triggerRef.current?.focus()
        return
      }
      if (event.key === "Tab") {
        onOpenChange(false)
        return
      }
      const list = items()
      if (list.length === 0) return
      const index = list.indexOf(document.activeElement as HTMLElement)
      if (event.key === "ArrowDown") {
        event.preventDefault()
        list[(index + 1) % list.length].focus()
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        list[(index - 1 + list.length) % list.length].focus()
      } else if (event.key === "Home") {
        event.preventDefault()
        list[0].focus()
      } else if (event.key === "End") {
        event.preventDefault()
        list[list.length - 1].focus()
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onOpenChange])

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {trigger({
        ref: triggerRef,
        onClick: () => onOpenChange(!open),
        "aria-haspopup": "menu",
        "aria-expanded": open,
      })}

      {open ? (
        <CloseContext.Provider value={() => onOpenChange(false)}>
          <div
            ref={panelRef}
            role="menu"
            aria-label={label}
            className="absolute right-0 top-full z-50 mt-1 max-h-[min(70svh,24rem)] w-64 max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-xl border border-input bg-popover p-1 shadow-[0_16px_40px_rgb(0_0_0/0.55)] animate-in fade-in zoom-in-95 duration-100"
          >
            {children}
          </div>
        </CloseContext.Provider>
      ) : null}
    </div>
  )
}

const itemClass =
  "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.08] focus-visible:outline-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50"

interface MenuItemProps {
  label: string
  onSelect: () => void
  icon?: LucideIcon
  /** Count shown at the right edge, e.g. people being compared. */
  badge?: number
  /** Celeste for the actions that involve other people; red for destructive ones. */
  tone?: "default" | "sky" | "destructive"
}

/** An action in the menu. Choosing it runs `onSelect` and closes the menu. */
export function MenuItem({ label, onSelect, icon: Icon, badge, tone = "default" }: MenuItemProps) {
  const close = useContext(CloseContext)
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        close()
        onSelect()
      }}
      className={cn(itemClass, tone === "destructive" && "text-destructive")}
    >
      {Icon ? (
        <Icon
          aria-hidden
          className={cn("size-[18px] shrink-0", tone === "sky" ? "text-sky" : tone === "destructive" ? "" : "text-muted-foreground")}
        />
      ) : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-sky px-1.5 text-xs font-semibold text-[#06222e]">
          {badge}
        </span>
      ) : null}
    </button>
  )
}

interface MenuChoiceProps {
  label: string
  checked: boolean
  onSelect: () => void
  /** "radio" for one-of-many options, "checkbox" for an on/off option. */
  kind: "radio" | "checkbox"
  disabled?: boolean
}

/** A selectable option with a check mark on the right. */
export function MenuChoice({ label, checked, onSelect, kind, disabled }: MenuChoiceProps) {
  const close = useContext(CloseContext)
  return (
    <button
      type="button"
      role={kind === "radio" ? "menuitemradio" : "menuitemcheckbox"}
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      onClick={() => {
        if (disabled) return
        close()
        onSelect()
      }}
      className={itemClass}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {checked ? <Check aria-hidden className="size-4 shrink-0 text-sky" /> : null}
    </button>
  )
}

export function MenuSeparator() {
  return <div role="separator" className="-mx-1 my-1 border-t border-border" />
}
