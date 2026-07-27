// src/features/catalogs/components/delete-speaker-alert.tsx

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteSpeaker } from "@/features/catalogs/actions";

export function DeleteSpeakerAlert({
  speakerId,
  speakerLabel,
}: {
  speakerId: string;
  speakerLabel: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    setIsPending(true);
    const result = await deleteSpeaker(speakerId);
    setIsPending(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.push("/catalogs/speakers");
    router.refresh();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Eliminar
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar «{speakerLabel}»?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Si alguna escena lo referencia, la
            referencia queda colgante (sin FK — modelo JSONB del grafo de
            señal).
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? "Eliminando…" : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
