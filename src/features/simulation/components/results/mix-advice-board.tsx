// src/features/simulation/components/results/mix-advice-board.tsx — generar y volver a generar.
//
// El consejo guardado se pinta al entrar y el botón dice "Volver a pedirlo": la llamada la paga el
// usuario con su clave, así que regenerar tiene que ser una decisión suya y nunca un efecto de
// abrir la página.
//
// Mientras se genera no se esconde el consejo anterior. Una espera de medio minuto con la pantalla
// en blanco se lee como que algo se rompió.

"use client";

import { Sparkles } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { generateMixAdvice } from "@/features/simulation/actions/generate-mix-advice";
import { MixAdviceView } from "@/features/simulation/components/results/mix-advice-view";
import type { StoredMixAdvice } from "@/features/simulation/queries/get-mix-advice";

type BoardState = { stored: StoredMixAdvice | null; error: string | null };

export function MixAdviceBoard({
  simulationId,
  stored,
  provider,
}: {
  simulationId: string;
  stored: StoredMixAdvice | null;
  /** El proveedor configurado, o null si no hay clave: decide si el botón puede existir. */
  provider: string | null;
}) {
  const [state, action, isPending] = useActionState<BoardState, FormData>(
    async (previous) => {
      const result = await generateMixAdvice(simulationId);
      if (!result.ok) {
        return { stored: previous.stored, error: result.error.message };
      }
      // La action ya lo guardó; aquí solo se refleja sin esperar a que revalide la página.
      return { stored: result.data, error: null };
    },
    { stored, error: null },
  );

  if (!provider) {
    return (
      <p className="text-sm text-muted-foreground">
        Configura una clave de IA en Ajustes para pedir el ajuste de mezcla por
        instrumento.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={action}>
        <Button type="submit" size="sm" disabled={isPending}>
          <Sparkles className="mr-1 size-3.5" aria-hidden />
          {isPending
            ? "Pensando la mezcla…"
            : state.stored
              ? "Volver a pedirlo"
              : "Pedir ajuste de mezcla"}
        </Button>
      </form>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      {state.stored ? <MixAdviceView stored={state.stored} /> : null}
    </div>
  );
}
