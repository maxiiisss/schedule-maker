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
  /** Only used when editing: removes the block being edited. */
  onDelete?: () => void
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
  onDelete,
}: CourseDialogProps) {
  const isEdit = mode === "edit"

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar ramo" : "Agregar ramo"}
      description={
        isEdit
          ? "Cambia el horario, la sala o el color de este bloque."
          : existingGroups.length > 0
            ? "Agrega un ramo nuevo o un horario adicional a uno existente."
            : "Completa los datos para agregar un nuevo bloque a tu horario."
      }
      footer={
        <div className="flex items-center justify-end gap-2">
          {isEdit && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              onClick={onDelete}
              className="mr-auto h-9 px-3 text-destructive hover:text-destructive"
            >
              Eliminar
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onClose} className="h-9 px-4">
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} className="h-9 px-4">
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
