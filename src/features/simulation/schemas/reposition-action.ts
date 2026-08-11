// src/features/simulation/schemas/reposition-action.ts — la única acción que la UI sabe aplicar.
//
// `SimulationRecommendation.action` es laxo en el contrato (solo garantiza `type`), porque el motor
// puede empezar a emitir acciones nuevas antes de que esta app las conozca. Este schema es el
// estrecho: describe la forma que sí se sabe ejecutar, y lo que no la cumpla se queda sin botón en
// vez de romper la tarjeta.
//
// El nombre de los campos es el del motor (app/recommend/rules/coverage_gap.py), no el del ejemplo
// de la Sección 03 del doc maestro: ese dice `proposed.rotationDeg.yaw` y el motor emite
// `proposed.yawDeg`. Manda lo que viaja por el cable.

import { z } from "zod";

export const repositionActionSchema = z.looseObject({
  type: z.literal("reposition_speaker"),
  /** Es el `id` de la fuente en el payload, que el compilador puso igual al nodeId del grafo. */
  sourceId: z.string().min(1),
  proposed: z.looseObject({
    yawDeg: z.number(),
    pitchDeg: z.number(),
  }),
});

export type RepositionAction = z.infer<typeof repositionActionSchema>;

export function isRepositionAction(action: unknown): boolean {
  return repositionActionSchema.safeParse(action).success;
}
