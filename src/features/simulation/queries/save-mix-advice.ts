// src/features/simulation/queries/save-mix-advice.ts — guarda el consejo de mezcla.
//
// Reemplaza en vez de acumular: el consejo describe la simulación, que está congelada, así que dos
// versiones del mismo no son historia sino ruido —y la vista tendría que elegir una sin criterio.
// Regenerar es pedir otro, no coleccionarlos.
//
// Borrado y alta van en una transacción porque `SimResult` no tiene único en (simulationId, kind)
// —el motor escribe varias filas de kinds distintos de golpe— y sin ella dos pulsaciones seguidas
// del botón dejarían dos consejos vivos.

import type { StoredMixAdvice } from "@/features/simulation/queries/get-mix-advice";
import { db } from "@/lib/db";
import { asJson } from "@/lib/prisma-json";

export async function saveMixAdvice(
  simulationId: string,
  stored: StoredMixAdvice,
): Promise<void> {
  await db.$transaction([
    db.simResult.deleteMany({ where: { simulationId, kind: "MIX_ADVICE" } }),
    db.simResult.create({
      data: {
        simulationId,
        kind: "MIX_ADVICE",
        // El resumen es lo listable: cuántos canales y quién lo escribió, sin traerse el consejo.
        summary: asJson({
          instruments: stored.advice.instruments.length,
          provider: stored.provider,
          model: stored.model,
          generatedAt: stored.generatedAt,
        }),
        payload: asJson(stored),
      },
    }),
  ]);
}
