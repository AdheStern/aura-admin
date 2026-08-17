// src/features/simulation/queries/save-advice.ts — guarda un consejo de IA de una simulación.
//
// Sirve a los dos —mezcla y tratamiento— porque el motivo por el que se guarda es el mismo: la
// llamada la paga el usuario con su clave, y lo que se enseñe en la defensa tiene que poder volver
// a enseñarse igual. Van colgados de la simulación, que está congelada, así que el consejo describe
// siempre la misma física; regenerar es un botón.
//
// Reemplaza en vez de acumular: el consejo describe esa simulación, así que dos versiones del mismo
// no son historia sino ruido, y la vista tendría que elegir una sin criterio.
//
// Borrado y alta van en una transacción porque `SimResult` no tiene único en (simulationId, kind)
// —el motor escribe varias filas de kinds distintos de golpe— y sin ella dos pulsaciones seguidas
// del botón dejarían dos consejos vivos.

import type { ResultKind } from "@/features/simulation/model/to-sim-results";
import { db } from "@/lib/db";
import { asJson } from "@/lib/prisma-json";

export type AdviceKind = Extract<ResultKind, "MIX_ADVICE" | "PANEL_ADVICE">;

export async function saveAdvice(
  simulationId: string,
  kind: AdviceKind,
  payload: unknown,
  /** Lo listable: quién lo escribió y cuánto trae, sin traerse el consejo entero. */
  summary: unknown,
): Promise<void> {
  await db.$transaction([
    db.simResult.deleteMany({ where: { simulationId, kind } }),
    db.simResult.create({
      data: {
        simulationId,
        kind,
        summary: asJson(summary),
        payload: asJson(payload),
      },
    }),
  ]);
}
