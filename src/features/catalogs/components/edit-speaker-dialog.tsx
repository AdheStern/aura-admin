// src/features/catalogs/components/edit-speaker-dialog.tsx

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
import { updateSpeaker } from "@/features/catalogs/actions";
import { SpeakerFormFields } from "@/features/catalogs/components/speaker-form-fields";
import { updateSpeakerSchema } from "@/features/catalogs/schemas/update-speaker";

type DialogState = { error: string | null };

export function EditSpeakerDialog({
  speakerId,
  brand,
  model,
  specJson,
  initialVerified,
}: {
  speakerId: string;
  brand: string;
  model: string;
  specJson: string;
  initialVerified: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [verified, setVerified] = useState(initialVerified);

  const [state, action, isPending] = useActionState<DialogState, FormData>(
    async (_prevState, formData) => {
      const parsed = updateSpeakerSchema.safeParse({
        speakerId,
        brand: formData.get("brand"),
        model: formData.get("model"),
        specJson: formData.get("specJson"),
        verified,
      });
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
      }

      const result = await updateSpeaker(
        parsed.data.speakerId,
        parsed.data.brand,
        parsed.data.model,
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
          <DialogTitle>Editar parlante</DialogTitle>
        </DialogHeader>
        <form
          id="edit-speaker-form"
          action={action}
          className="flex flex-col gap-4"
        >
          <SpeakerFormFields
            defaultBrand={brand}
            defaultModel={model}
            defaultSpecJson={specJson}
            verified={{ checked: verified, onCheckedChange: setVerified }}
          />
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="submit" form="edit-speaker-form" disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
