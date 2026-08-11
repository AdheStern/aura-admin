// src/features/simulation/queries/resolve-treatment.ts — las sugerencias de tratamiento de una
// simulación, ya resueltas contra el catálogo.
//
// Todo sale del `SimulationRequest` CONGELADO: la geometría que produjo los m² que faltan y los
// materiales que tenía puestos entonces. La escena de hoy puede haber cambiado, y medir la
// sugerencia contra otra sala daría metros que no corresponden a esos números.
//
// Los candidatos sí son el catálogo de HOY: lo que se puede comprar ahora es lo de ahora.
//
// Resuelve la lista entera de una vez y no una recomendación por llamada: el request y el catálogo
// son los mismos para todas, y RtTargetRule puede emitir dos hallazgos (uno por dirección).

import { simulationRequestSchema } from "@/contracts";
import {
  suggestTreatment,
  type TreatmentSuggestion,
} from "@/features/simulation/model/suggest-treatment";
import {
  isTreatable,
  treatableSurfaces,
} from "@/features/simulation/model/treatable-surfaces";
import { listAbsorptionCandidates } from "@/features/simulation/queries/list-absorption-candidates";
import { parseAbsorptionAction } from "@/features/simulation/schemas/absorption-action";
import { db } from "@/lib/db";

export type Treatment = {
  bandHz: number;
  deltaAbsorptionM2: number;
  direction: "add" | "reduce";
  suggestions: TreatmentSuggestion[];
};

/** recommendationId → tratamiento. Ausente = esa recomendación no es de absorción, o no hay nada
 *  del catálogo que quepa. */
export type TreatmentsById = Map<string, Treatment>;

export async function resolveTreatments(
  simulationId: string,
  recommendations: readonly { id: string; action: unknown }[],
): Promise<TreatmentsById> {
  const pending = recommendations
    .map((item) => ({
      id: item.id,
      action: parseAbsorptionAction(item.action),
    }))
    .filter((item) => item.action !== null);
  if (pending.length === 0) return new Map();

  const simulation = await db.simulation.findUnique({
    where: { id: simulationId },
    select: { request: true },
  });
  const request = simulationRequestSchema.safeParse(simulation?.request);
  if (!request.success) return new Map();

  const surfaces = treatableSurfaces(request.data.room).filter(isTreatable);
  const installed = installedAbsorption(request.data.materials);
  const candidates = await listAbsorptionCandidates();

  const treatments: TreatmentsById = new Map();
  for (const { id, action } of pending) {
    if (!action) continue;

    const bandKey = String(action.worstBandHz);
    const deltaAbsorptionM2 = action.deltaAbsorptionM2ByBand[bandKey];
    if (typeof deltaAbsorptionM2 !== "number") continue;

    const direction = action.type === "add_absorption" ? "add" : "reduce";
    const suggestions = suggestTreatment({
      direction,
      bandKey,
      deltaAbsorptionM2,
      surfaces,
      installed,
      candidates,
    });

    if (suggestions.length > 0) {
      treatments.set(id, {
        bandHz: action.worstBandHz,
        deltaAbsorptionM2,
        direction,
        suggestions,
      });
    }
  }

  return treatments;
}

function installedAbsorption(
  materials: Record<string, { absorption: Record<string, number> }>,
): Record<string, Record<string, number>> {
  return Object.fromEntries(
    Object.entries(materials).map(([id, spec]) => [id, spec.absorption]),
  );
}
