// src/features/simulation/components/simulate-button.tsx — el disparador de la Fase 5.
//
// Hoy nunca envía nada: encolar exige los modelos Simulation/SimulationJob que el doc maestro pone
// en la Fase 5/6, y el compilador ya está listo esperándolos (model/to-simulation-request.ts). Lo
// que sí hace ya es decir por qué NO se puede simular, que es la mitad útil: las razones se
// arreglan en pantallas distintas y descubrirlas de una en una obligaría a ir y volver.

"use client";

import { Button } from "@/components/ui/button";
import type { SimulationBlocker } from "@/features/simulation/model/can-simulate";

export function SimulateButton({
  blockers,
}: {
  blockers: SimulationBlocker[];
}) {
  const isReady = blockers.length === 0;

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="w-full"
        disabled
        title={
          isReady
            ? "El envío al motor llega en la Fase 5"
            : "Faltan cosas por resolver"
        }
      >
        Simular
      </Button>
      {isReady ? (
        <p className="text-xs text-muted-foreground">
          Todo listo para simular. El envío al motor llega en la Fase 5.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {blockers.map((blocker) => (
            <li key={blocker.code} className="text-xs text-muted-foreground">
              {blocker.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
