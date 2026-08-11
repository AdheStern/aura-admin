// src/features/simulation/schemas/absorption-action.ts — la acción de RtTargetRule.
//
// `SimulationRecommendation.action` es laxo en el contrato: solo garantiza `type`. Este schema es
// el estrecho, el de la forma que la app sabe convertir en materiales y superficies. Lo que no lo
// cumpla se queda sin la sección de tratamiento en vez de romper la tarjeta.
//
// Las claves de banda llegan como STRING ("125") y solo vienen las bandas que disparan.

import { z } from "zod";

export const absorptionActionSchema = z.looseObject({
  type: z.enum(["add_absorption", "reduce_absorption"]),
  /** El borde del rango al que apunta el motor, en segundos. */
  targetRtS: z.number().positive(),
  /** La banda que manda: es en la que se dimensiona la sugerencia. */
  worstBandHz: z.number().positive(),
  /** m² sabin que faltan (o sobran); siempre positivos. */
  deltaAbsorptionM2ByBand: z.record(z.string(), z.number()),
});

export type AbsorptionAction = z.infer<typeof absorptionActionSchema>;

export function parseAbsorptionAction(
  action: unknown,
): AbsorptionAction | null {
  const parsed = absorptionActionSchema.safeParse(action);
  return parsed.success ? parsed.data : null;
}
