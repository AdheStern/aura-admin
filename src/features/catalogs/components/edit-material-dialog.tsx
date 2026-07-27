// src/features/catalogs/components/edit-material-dialog.tsx

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
import { updateMaterial } from "@/features/catalogs/actions";
import { MaterialFormFields } from "@/features/catalogs/components/material-form-fields";
import { updateMaterialSchema } from "@/features/catalogs/schemas/update-material";

type DialogState = { error: string | null };

export function EditMaterialDialog({
  materialId,
  specJson,
  initialVerified,
}: {
  materialId: string;
  specJson: string;
  initialVerified: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [verified, setVerified] = useState(initialVerified);

  const [state, action, isPending] = useActionState<DialogState, FormData>(
    async (_prevState, formData) => {
      const parsed = updateMaterialSchema.safeParse({
        materialId,
        specJson: formData.get("specJson"),
        verified,
      });
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
      }

      const result = await updateMaterial(
        parsed.data.materialId,
        parsed.data.specJson,
        parsed.data.verified,
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar material</DialogTitle>
        </DialogHeader>
        <form
          id="edit-material-form"
          action={action}
          className="flex flex-col gap-4"
        >
          <MaterialFormFields
            defaultSpecJson={specJson}
            verified={{ checked: verified, onCheckedChange: setVerified }}
          />
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="submit" form="edit-material-form" disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
