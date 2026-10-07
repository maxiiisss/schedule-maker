"use client"

import { Plus } from "lucide-react"

/** Round "add" button in the corner of the screen on phones. Hidden from 640 px up. */
export function MobileFab({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_20px_rgb(0_0_0/0.45)] transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:hidden"
    >
      <Plus className="size-7" strokeWidth={2.25} aria-hidden />
    </button>
  )
}
