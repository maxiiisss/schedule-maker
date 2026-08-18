"use client"

import { Button } from "@/components/ui/button"
import type { MutationResult } from "@/hooks/use-schedule"
import type { CourseGroup } from "@/lib/schedule/courses"
import type { CourseDraft } from "@/lib/schedule/types"
import { CourseForm } from "./course-form"
import { Modal } from "./modal"

const FORM_ID = "course-form"

interface CourseDialogProps {
  open: boolean
  mode: "create" | "edit"
  /** Re-mounts the form when the target course changes, resetting its state. */
  formKey: string
  initialDraft: CourseDraft
  existingGroups?: CourseGroup[]
  onClose: () => void
  onSubmit: (draft: CourseDraft) => MutationResult
}

/** Modal shell for creating or editing a course. */
export function CourseDialog({
  open,
  mode,
  formKey,
  initialDraft,
  existingGroups = [],
  onClose,
  onSubmit,
}: CourseDialogProps) {
  const isEdit = mode === "edit"

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar ramo" : "Agregar ramo"}
      description={
        isEdit
          ? "Modifica los datos del bloque en tu horario."
          : existingGroups.length > 0
            ? "Agrega un ramo nuevo o un horario adicional a uno existente."
            : "Completa los datos para agregar un nuevo bloque a tu horario."
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} className="h-10 px-4">
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} className="h-10 px-4">
            {isEdit ? "Guardar cambios" : "Agregar ramo"}
          </Button>
        </div>
      }
    >
      <CourseForm
        key={formKey}
        formId={FORM_ID}
        mode={mode}
        initialDraft={initialDraft}
        existingGroups={existingGroups}
        onSubmit={onSubmit}
      />
    </Modal>
  )
}
