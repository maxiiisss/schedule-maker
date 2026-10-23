/**
 * First focusable element of the page: lets keyboard users jump past the header
 * straight to the schedule. It waits just above the screen and slides in on focus.
 */
export function SkipLink({ target, children = "Saltar al horario" }: { target: string; children?: string }) {
  return (
    <a
      href={`#${target}`}
      className="fixed left-3 top-3 z-[70] -translate-y-[200%] rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-transform duration-150 focus:translate-y-0 focus:outline-2 focus:outline-offset-2 focus:outline-ring"
    >
      {children}
    </a>
  )
}
