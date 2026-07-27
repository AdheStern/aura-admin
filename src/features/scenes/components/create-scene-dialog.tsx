// src/features/scenes/components/create-scene-dialog.tsx

"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createScene } from "@/features/scenes/actions";
import { createSceneSchema } from "@/features/scenes/schemas";

type DialogState = { error: string | null };

export function CreateSceneDialog({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [state, action, isPending] = useActionState<DialogState, FormData>(
    async (_prevState, formData) => {
      const parsed = createSceneSchema.safeParse({
        projectId,
        name: formData.get("name"),
      });
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
      }

      const result = await createScene(parsed.data.projectId, parsed.data.name);
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
      <DialogTrigger render={<Button />}>+ Nueva escena</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva escena</DialogTitle>
        </DialogHeader>
        <form
          id="create-scene-form"
          action={action}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="submit" form="create-scene-form" disabled={isPending}>
            {isPending ? "Creando…" : "Crear escena"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
