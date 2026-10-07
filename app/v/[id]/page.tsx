import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SharedScheduleView } from "@/components/share/shared-schedule-view"
import { loadShared } from "@/lib/share/load"
import { getShareStore } from "@/lib/share/store"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const shared = await loadShared(id)
  const owner = shared?.name ? `Horario de ${shared.name}` : "Horario compartido"

  return {
    title: `${owner} · ScheduleGrid`,
    description: "Mira este horario semanal y crea el tuyo en ScheduleGrid.",
    // Links are unlisted: keep them out of search results.
    robots: { index: false, follow: false },
  }
}

export default async function SharedSchedulePage({ params }: PageProps) {
  const { id } = await params
  const shared = await loadShared(id)
  if (!shared) notFound()

  // Opening a link keeps it alive.
  await getShareStore()?.renew(id)

  return (
    <main className="min-h-svh bg-background">
      <SharedScheduleView name={shared.name} courses={shared.courses} />
    </main>
  )
}
