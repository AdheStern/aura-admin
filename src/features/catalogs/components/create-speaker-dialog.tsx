// src/features/catalogs/components/create-speaker-dialog.tsx

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
import { createSpeaker } from "@/features/catalogs/actions";
import { EXAMPLE_SPEAKER_SPEC_JSON } from "@/features/catalogs/components/example-specs";
import { SpeakerFormFields } from "@/features/catalogs/components/speaker-form-fields";
import { createSpeakerSchema } from "@/features/catalogs/schemas/create-speaker";

type DialogState = { error: string | null };

export function CreateSpeakerDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [state, action, isPending] = useActionState<DialogState, FormData>(
    async (_prevState, formData) => {
      const parsed = createSpeakerSchema.safeParse({
        brand: formData.get("brand"),
        model: formData.get("model"),
        specJson: formData.get("specJson"),
      });
      if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
      }

      const result = await createSpeaker(
        parsed.data.brand,
        parsed.data.model,
        parsed.data.specJson,
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
      <DialogTrigger render={<Button />}>+ Nuevo parlante</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo parlante</DialogTitle>
        </DialogHeader>
        <form
          id="create-speaker-form"
          action={action}
          className="flex flex-col gap-4"
        >
          <SpeakerFormFields defaultSpecJson={EXAMPLE_SPEAKER_SPEC_JSON} />
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
        <DialogFooter>
          <Button type="submit" form="create-speaker-form" disabled={isPending}>
            {isPending ? "Creando…" : "Crear parlante"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
