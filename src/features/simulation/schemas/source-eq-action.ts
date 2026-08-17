// src/features/simulation/schemas/source-eq-action.ts — la acción de EQ de fuente, ya tipada.
//
// Laxa como el resto de acciones: el motor puede añadir campos y esta app no debe romperse por
// ello (política de salida del contrato). Solo se exige lo que la curva necesita para dibujarse.

import { z } from "zod";

export const sourceEqActionSchema = z.looseObject({
  type: z.literal("source_eq"),
  sourceId: z.string().min(1),
  q: z.number().positive(),
  /** banda de octava en Hz → ganancia del filtro. Solo trae las bandas que pasan del umbral. */
  gainDbByBand: z.record(z.string(), z.number()),
});

export type SourceEqAction = z.infer<typeof sourceEqActionSchema>;

export function parseSourceEqAction(action: unknown): SourceEqAction | null {
  const parsed = sourceEqActionSchema.safeParse(action);
  return parsed.success ? parsed.data : null;
}

/** El desvío medido banda a banda, que es lo que la corrección intenta aplanar. */
export function deviationByBand(
  evidence: unknown,
): Record<string, number> | null {
  if (typeof evidence !== "object" || evidence === null) return null;

  const value = (evidence as Record<string, unknown>).deviationDbByBand;
  const parsed = z.record(z.string(), z.number()).safeParse(value);
  return parsed.success ? parsed.data : null;
}
