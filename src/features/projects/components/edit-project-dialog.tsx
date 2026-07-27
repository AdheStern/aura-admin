// src/features/projects/components/edit-project-dialog.tsx

"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateProject } from "@/features/projects/actions";
import { ProjectFormFields } from "@/features/projects/components/project-form-fields";
import { updateProjectSchema } from "@/features/projects/schemas/update-project";

type DialogState = { error: string | null };

export function EditProjectDialog({
  projectId,
  name,
  description,
}: {
  projectId: string;
  name: string;
  description: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [state, action, isPending] = useActionState<DialogState, FormData>(
    async (_prevState, formData) => {
      const parsed = updateProjectSchema.safeParse({
        projectId,
        name: formData.get("name"),
        description: formData.get("description") || undefined,
      });
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
      }

      const result = await updateProject(
        parsed.data.projectId,
        parsed.data.name,
        parsed.data.description,
      );
      if (!result.ok) {
        return { error: result.error.message };
      }

      setOpen(false);
      router.refresh();
      return { error: null };
    },
    { error: null },
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        Editar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar proyecto</DialogTitle>
          <DialogDescription>
            Actualiza el nombre o la descripción.
          </DialogDescription>
        </DialogHeader>
        <form
          id="edit-project-form"
          action={action}
          className="flex flex-col gap-4"
        >
          <ProjectFormFields
            defaultName={name}
            defaultDescription={description ?? ""}
          />
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="submit" form="edit-project-form" disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
