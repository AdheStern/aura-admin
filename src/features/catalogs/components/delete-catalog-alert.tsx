// src/features/catalogs/components/delete-catalog-alert.tsx — confirmación de borrado común.
// La action llega como prop desde el server component del detalle (las Server Actions son
// referencias serializables), así que un solo componente sirve a los cinco catálogos.

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

export function DeleteCatalogAlert({
  itemId,
  itemLabel,
  onDelete,
  redirectTo,
}: {
  itemId: string;
  itemLabel: string;
  onDelete: (
    id: string,
  ) => Promise<{ ok: true } | { ok: false; error: { message: string } }>;
  redirectTo: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleDelete() {
    setIsPending(true);
    const result = await onDelete(itemId);
    setIsPending(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Eliminar
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar «{itemLabel}»?</AlertDialogTitle>
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
