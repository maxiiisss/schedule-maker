import Link from "next/link"

export default function SharedScheduleNotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-[17px] font-semibold tracking-tight">Este enlace ya no está disponible</h1>
      <p className="max-w-[44ch] text-[13px] text-muted-foreground text-pretty">
        Pudo haber caducado o la persona que lo compartió lo dejó de compartir. Pídele uno nuevo, o
        arma tu propio horario.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Crear mi horario
      </Link>
    </main>
  )
}
