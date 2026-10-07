"use client"

import { Eye, EyeOff, Plus, X } from "lucide-react"
import { useState } from "react"

import { Modal } from "@/components/schedule/modal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { resolveColor } from "@/lib/schedule/colors"
import { MAX_PEOPLE, type Person } from "@/lib/schedule/compare"

export interface AddLinkResult {
  ok: boolean
  message: string
}

interface CompareDialogProps {
  open: boolean
  onClose: () => void
  people: Person[]
  onAddLink: (text: string) => Promise<AddLinkResult>
  onRename: (id: string, name: string) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}

/** Add, show/hide, rename and remove the schedules being compared. */
export function CompareDialog({
  open,
  onClose,
  people,
  onAddLink,
  onRename,
  onToggle,
  onRemove,
}: CompareDialogProps) {
  const [link, setLink] = useState("")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<AddLinkResult | null>(null)
  const full = people.length >= MAX_PEOPLE

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!link.trim() || busy) return
    setBusy(true)
    setResult(null)
    const outcome = await onAddLink(link)
    setResult(outcome)
    if (outcome.ok) setLink("")
    setBusy(false)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Comparar horarios"
      description="Ve tu horario junto al de otras personas y encuentra las horas en que todos están libres."
    >
      <div className="grid gap-5">
        <form onSubmit={submit} className="grid gap-2" noValidate>
          <label htmlFor="compare-link" className="text-xs text-muted-foreground">
            Enlace de un horario compartido
          </label>
          <div className="flex gap-2">
            <input
              id="compare-link"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="Pega aquí el enlace"
              autoComplete="off"
              disabled={full}
              className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:opacity-50"
            />
            <Button type="submit" disabled={busy || full || !link.trim()} className="h-9 px-3.5">
              <Plus className="size-4" />
              {busy ? "Buscando…" : "Agregar"}
            </Button>
          </div>
          {full ? (
            <p className="text-xs text-muted-foreground">
              Puedes comparar hasta {MAX_PEOPLE} horarios a la vez. Quita uno para agregar otro.
            </p>
          ) : null}
          {result ? (
            <p
              role="status"
              className={cn("text-[13px] font-medium", result.ok ? "text-sky" : "text-destructive")}
            >
              {result.message}
            </p>
          ) : null}
        </form>

        <section aria-label="Horarios agregados" className="grid gap-2">
          {people.length === 0 ? (
            <p className="rounded-lg border border-dashed border-input px-4 py-5 text-center text-[13px] text-muted-foreground text-pretty">
              Aún no comparas ningún horario. Pide a alguien que use <strong className="font-medium text-foreground">Compartir</strong> y
              pega aquí su enlace.
            </p>
          ) : (
            <ul className="grid gap-1.5">
              {people.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  onRename={onRename}
                  onToggle={onToggle}
                  onRemove={onRemove}
                />
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-muted-foreground text-pretty">
          Los horarios que agregas se guardan solo en este dispositivo. Son una copia del momento en que
          se compartieron.
        </p>
      </div>
    </Modal>
  )
}

function PersonRow({
  person,
  onRename,
  onToggle,
  onRemove,
}: {
  person: Person
  onRename: (id: string, name: string) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}) {
  const color = resolveColor(person.colorId).hex
  const blocks = person.courses.reduce((sum, course) => sum + course.days.length, 0)

  return (
    <li
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2",
        !person.visible && "opacity-60",
      )}
    >
      <span aria-hidden className="size-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1">
        <input
          key={person.name}
          defaultValue={person.name}
          maxLength={40}
          aria-label={`Nombre de ${person.name}`}
          onBlur={(event) => {
            const next = event.target.value.trim()
            if (next && next !== person.name) onRename(person.id, next)
            else event.target.value = person.name
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur()
          }}
          className="h-7 w-full rounded border border-transparent bg-transparent px-1.5 text-[13px] font-medium text-foreground hover:border-input focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25"
        />
        <p className="px-1.5 text-xs text-muted-foreground">
          {person.courses.length} {person.courses.length === 1 ? "ramo" : "ramos"} · {blocks}{" "}
          {blocks === 1 ? "bloque" : "bloques"}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onToggle(person.id)}
        aria-pressed={person.visible}
        aria-label={person.visible ? `Ocultar a ${person.name}` : `Mostrar a ${person.name}`}
        title={person.visible ? "Ocultar" : "Mostrar"}
      >
        {person.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(person.id)}
        aria-label={`Quitar a ${person.name}`}
        title="Quitar"
      >
        <X className="size-4" />
      </Button>
    </li>
  )
}
