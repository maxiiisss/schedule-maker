"use client"

import { Check, Copy, Link2, MessageCircle, Share2, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  createShare,
  loadOwnShare,
  loadShareName,
  revokeShare,
  saveShareName,
  type OwnShare,
  type ShareFailure,
} from "@/lib/share/client"
import type { Course } from "@/lib/schedule/types"

const FAILURE_MESSAGES: Record<ShareFailure, string> = {
  "rate-limited": "Hiciste demasiados intentos. Espera un minuto y vuelve a probar.",
  unavailable: "Compartir por enlace no está disponible por ahora.",
  "too-large": "El horario es demasiado grande para compartirlo.",
  failed: "No se pudo crear el enlace. Revisa tu conexión y vuelve a intentarlo.",
}

interface SharePanelProps {
  courses: Course[]
}

/** Create, copy, send and revoke a public link to the current schedule. */
export function SharePanel({ courses }: SharePanelProps) {
  const [share, setShare] = useState<OwnShare | null>(null)
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    setShare(loadOwnShare())
    setName(loadShareName())
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function")
  }, [])

  const create = async () => {
    setBusy(true)
    setMessage(null)
    saveShareName(name)
    const previous = share
    const result = await createShare(name, courses)
    if (result.ok) {
      setShare(result.share)
      setCopied(false)
      // Replacing a link: the old one stops working.
      if (previous) void revokeShare(previous)
    } else {
      setMessage(FAILURE_MESSAGES[result.reason])
    }
    setBusy(false)
  }

  const stopSharing = async () => {
    if (!share) return
    setBusy(true)
    setMessage(null)
    const done = await revokeShare(share)
    if (done) {
      setShare(null)
      setMessage("Dejaste de compartir. El enlace ya no funciona.")
    } else {
      setMessage("No se pudo desactivar el enlace. Inténtalo de nuevo.")
    }
    setBusy(false)
  }

  const copy = async () => {
    if (!share) return
    try {
      await navigator.clipboard.writeText(share.url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setMessage("No se pudo copiar. Selecciona el enlace y cópialo a mano.")
    }
  }

  const nativeShare = async () => {
    if (!share) return
    try {
      await navigator.share({ title: share.name || "Mi horario", text: "Mira mi horario:", url: share.url })
    } catch {
      // the user closed the share sheet
    }
  }

  const whatsappHref = share
    ? `https://wa.me/?text=${encodeURIComponent(`${share.name ? `Mira mi horario «${share.name}»` : "Mira mi horario"}: ${share.url}`)}`
    : undefined

  return (
    <section aria-label="Compartir enlace" className="grid gap-3">

      {share ? (
        <>
          <div className="flex gap-2">
            <input
              readOnly
              value={share.url}
              aria-label="Enlace para compartir"
              onFocus={(event) => event.currentTarget.select()}
              className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25"
            />
            <Button variant="outline" onClick={copy} className="h-9 px-3">
              {copied ? <Check className="size-4 text-sky" /> : <Copy className="size-4" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              nativeButton={false}
              render={<a href={whatsappHref} target="_blank" rel="noopener noreferrer" />}
              variant="outline"
              className="h-9 px-3"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </Button>
            {canShare ? (
              <Button variant="outline" onClick={nativeShare} className="h-9 px-3">
                <Share2 className="size-4" />
                Compartir…
              </Button>
            ) : null}
            <Button variant="ghost" onClick={stopSharing} disabled={busy} className="h-9 px-3">
              <Trash2 className="size-4" />
              Dejar de compartir
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-pretty">
            El enlace muestra el horario tal como estaba al crearlo ({new Date(share.createdAt).toLocaleDateString("es")}).
            Si lo cambias, crea un enlace nuevo: el anterior dejará de funcionar.
          </p>
          <Button variant="outline" onClick={create} disabled={busy || courses.length === 0} className="h-9 justify-start px-3">
            <Link2 className="size-4" />
            Crear enlace nuevo
          </Button>
        </>
      ) : (
        <>
          <label className="grid gap-1.5">
            <span className="text-xs text-muted-foreground">Nombre del horario (opcional)</span>
            <input
              value={name}
              maxLength={40}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Primer semestre 2026"
              autoComplete="off"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25"
            />
          </label>
          <Button
            onClick={create}
            disabled={busy || courses.length === 0}
            className="h-9 justify-start px-3"
          >
            <Link2 className="size-4" />
            {busy ? "Creando enlace…" : "Crear enlace"}
          </Button>
          <p className="text-xs text-muted-foreground text-pretty">
            {courses.length === 0
              ? "Agrega al menos un ramo para poder compartir tu horario."
              : "Se creará un enlace público: cualquiera que lo tenga podrá ver tus ramos, horarios y salas. Caduca a los 90 días sin visitas."}
          </p>
        </>
      )}

      {message ? (
        <p role="status" className="text-[13px] font-medium text-sky">
          {message}
        </p>
      ) : null}
    </section>
  )
}
