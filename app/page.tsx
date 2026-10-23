import type { Metadata } from "next"

import { ScheduleView } from "@/components/schedule/schedule-view"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

export default function Page() {
  return (
    <main className="min-h-svh bg-background">
      <ScheduleView />
    </main>
  )
}
