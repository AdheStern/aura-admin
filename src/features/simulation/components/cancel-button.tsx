// src/features/simulation/components/cancel-button.tsx — parar la simulación en curso.
//
// El texto de espera dice "Cancelando…" y no "Cancelada": la cancelación es cooperativa y el job se
// detiene en su siguiente reporte de progreso, así que entre pulsar y parar puede avanzar un tramo
// más. Quien lo lea tiene que esperar eso, no pensar que el botón no funcionó.

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { cancelSimulation } from "@/features/simulation/actions/cancel-simulation";

type CancelState = { error: string | null };

export function CancelButton({
  sceneId,
  onCancelled,
}: {
  sceneId: string;
  onCancelled: () => void;
}) {
  const [state, action, isPending] = useActionState<CancelState, FormData>(
    async () => {
      const result = await cancelSimulation(sceneId);
      if (!result.ok) return { error: result.error.message };

      onCancelled();
      return { error: null };
    },
    { error: null },
  );

  return (
    <form action={action} className="flex flex-col gap-1">
      <Button type="submit" size="sm" variant="ghost" disabled={isPending}>
        {isPending ? "Cancelando…" : "Cancelar"}
      </Button>
      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
