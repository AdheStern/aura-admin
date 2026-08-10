// src/features/simulation/components/simulate-button.tsx — encola la simulación en el motor.
//
// Dice también por qué NO se puede simular, que es la mitad útil: las razones se arreglan en
// pantallas distintas y descubrirlas de una en una obligaría a ir y volver.
//
// Que la action devuelva ok NO significa que el cálculo saliera bien: solo que el motor aceptó el
// payload y encoló el job. El desenlace llega por callback, y por eso el estado lo cuenta la barra
// y no el retorno de la action.

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { enqueueSimulation } from "@/features/simulation/actions/enqueue-simulation";
import { JobStatus } from "@/features/simulation/components/job-status";
import { useJobProgress } from "@/features/simulation/hooks/use-job-progress";
import type { SimulationBlocker } from "@/features/simulation/model/can-simulate";

type EnqueueState = { error: string | null };

export function SimulateButton({
  sceneId,
  canManage,
  blockers,
}: {
  sceneId: string;
  canManage: boolean;
  blockers: SimulationBlocker[];
}) {
  const { job, isLive, refresh } = useJobProgress(sceneId);

  const [state, action, isPending] = useActionState<EnqueueState, FormData>(
    async () => {
      const result = await enqueueSimulation(sceneId);
      if (!result.ok) return { error: result.error.message };

      await refresh();
      return { error: null };
    },
    { error: null },
  );

  const isReady = blockers.length === 0;

  return (
    <form action={action} className="flex flex-col gap-2">
      <Button
        type="submit"
        className="w-full"
        disabled={!isReady || !canManage || isPending || isLive}
        title={isReady ? undefined : "Faltan cosas por resolver"}
      >
        {isLive ? "Simulando…" : "Simular"}
      </Button>

      {job ? <JobStatus job={job} /> : null}

      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}

      {isReady ? null : (
        <ul className="flex flex-col gap-1">
          {blockers.map((blocker) => (
            <li key={blocker.code} className="text-xs text-muted-foreground">
              {blocker.message}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
