import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
}

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-medium tabular-nums text-sky">Error 404</p>
      <h1 className="text-[22px] font-semibold tracking-tight text-balance">No encontramos esta página</h1>
      <p className="max-w-[44ch] text-[13px] text-muted-foreground text-pretty">
        La dirección puede estar mal escrita o la página ya no existe. Tu horario sigue guardado en este
        navegador.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Ir a mi horario
      </Link>
    </main>
  )
}
