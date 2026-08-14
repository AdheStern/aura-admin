// src/features/simulation/components/results/panel-advice-board.tsx — pedir el tratamiento.
//
// Mismo trato que el consejo de mezcla: lo guardado se pinta al entrar y regenerar es una decisión
// del usuario, porque la llamada la paga con su clave. Y no se esconde el consejo anterior mientras
// se piensa el nuevo: media espera con la pantalla en blanco se lee como que algo se rompió.

"use client";

import { Sparkles } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { generatePanelAdvice } from "@/features/simulation/actions/generate-panel-advice";
import { PanelAdviceView } from "@/features/simulation/components/results/panel-advice-view";
import type { StoredPanelAdvice } from "@/features/simulation/queries/get-panel-advice";

type BoardState = { stored: StoredPanelAdvice | null; error: string | null };

export function PanelAdviceBoard({
  simulationId,
  stored,
  provider,
}: {
  simulationId: string;
  stored: StoredPanelAdvice | null;
  /** El proveedor configurado, o null si no hay clave: decide si el botón puede existir. */
  provider: string | null;
}) {
  const [state, action, isPending] = useActionState<BoardState, FormData>(
    async (previous) => {
      const result = await generatePanelAdvice(simulationId);
      return result.ok
        ? { stored: result.data, error: null }
        : { stored: previous.stored, error: result.error.message };
    },
    { stored, error: null },
  );

  if (!provider) {
    return (
      <p className="text-sm text-muted-foreground">
        Configura una clave de IA en Ajustes para pedir dónde colocar los
        paneles.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <form action={action}>
        <Button type="submit" size="sm" disabled={isPending}>
          <Sparkles className="mr-1 size-3.5" aria-hidden />
          {isPending
            ? "Estudiando la sala…"
            : state.stored
              ? "Volver a pedirlo"
              : "Proponer dos paneles"}
        </Button>
      </form>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      {state.stored ? <PanelAdviceView stored={state.stored} /> : null}
    </div>
  );
}
