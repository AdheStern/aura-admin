// src/features/simulation/components/results/apply-orientation-button.tsx — "aplicar al 3D" (§5.4).
//
// Al aplicar, la escena vuelve a ROOM_READY y estos resultados quedan desactualizados: el aviso lo
// dice ANTES de pulsar, porque descubrirlo después parecería que el botón rompió algo.
//
// Solo se manda el id de la recomendación; los ángulos los relee el servidor de la simulación
// guardada, así que "aplicar" es siempre lo que el motor calculó.

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { applyRecommendation } from "@/features/simulation/actions/apply-recommendation";

type ApplyState = { error: string | null; applied: boolean };

export function ApplyOrientationButton({
  simulationId,
  recommendationId,
}: {
  simulationId: string;
  recommendationId: string;
}) {
  const [state, action, isPending] = useActionState<ApplyState, FormData>(
    async () => {
      const result = await applyRecommendation(simulationId, recommendationId);
      return result.ok
        ? { error: null, applied: true }
        : { error: result.error.message, applied: false };
    },
    { error: null, applied: false },
  );

  if (state.applied) {
    return (
      <p className="text-xs text-muted-foreground">
        Aplicada al recinto. Vuelve a simular para ver su efecto.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-1">
      <Button type="submit" size="sm" variant="secondary" disabled={isPending}>
        {isPending ? "Aplicando…" : "Aplicar al 3D"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Reorienta la caja en el recinto. Estos resultados quedarán
        desactualizados hasta que vuelvas a simular.
      </p>
      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
