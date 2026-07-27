// src/features/projects/components/create-project-dialog.tsx

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
import { createProject } from "@/features/projects/actions";
import { ProjectFormFields } from "@/features/projects/components/project-form-fields";
import { createProjectSchema } from "@/features/projects/schemas/create-project";

type DialogState = { error: string | null };

export function CreateProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [state, action, isPending] = useActionState<DialogState, FormData>(
    async (_prevState, formData) => {
      const parsed = createProjectSchema.safeParse({
        name: formData.get("name"),
        description: formData.get("description") || undefined,
      });
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
      }

      const result = await createProject(
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
      <DialogTrigger render={<Button />}>+ Nuevo proyecto</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo proyecto</DialogTitle>
          <DialogDescription>
            Dale un nombre y, si quieres, una descripción.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-project-form"
          action={action}
          className="flex flex-col gap-4"
        >
          <ProjectFormFields />
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="submit" form="create-project-form" disabled={isPending}>
            {isPending ? "Creando…" : "Crear proyecto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
