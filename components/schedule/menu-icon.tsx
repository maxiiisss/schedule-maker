import { cn } from "@/lib/utils"

const bar = "absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-200 ease-out"

/** Three lines that turn into a cross while the menu is open. */
export function MenuIcon({ open }: { open: boolean }) {
  return (
    <span aria-hidden className="relative block h-3.5 w-5">
      <span className={cn(bar, open ? "top-1.5 rotate-45" : "top-0")} />
      <span className={cn(bar, "top-1.5", open && "scale-x-0 opacity-0")} />
      <span className={cn(bar, open ? "top-1.5 -rotate-45" : "top-3")} />
    </span>
  )
}
