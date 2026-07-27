// src/features/catalogs/components/create-material-dialog.tsx

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
import { createMaterial } from "@/features/catalogs/actions";
import { EXAMPLE_MATERIAL_SPEC_JSON } from "@/features/catalogs/components/example-specs";
import { MaterialFormFields } from "@/features/catalogs/components/material-form-fields";
import { createMaterialSchema } from "@/features/catalogs/schemas/create-material";

type DialogState = { error: string | null };

export function CreateMaterialDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [state, action, isPending] = useActionState<DialogState, FormData>(
    async (_prevState, formData) => {
      const parsed = createMaterialSchema.safeParse({
        specJson: formData.get("specJson"),
      });
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
      }

      const result = await createMaterial(parsed.data.specJson);
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
      <DialogTrigger render={<Button />}>+ Nuevo material</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo material</DialogTitle>
        </DialogHeader>
        <form
          id="create-material-form"
          action={action}
          className="flex flex-col gap-4"
        >
          <MaterialFormFields defaultSpecJson={EXAMPLE_MATERIAL_SPEC_JSON} />
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="create-material-form"
            disabled={isPending}
          >
            {isPending ? "Creando…" : "Crear material"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
