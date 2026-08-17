// src/features/simulation/queries/resolve-panel-inputs.ts — la sala congelada y su medida.
//
// Todo sale del `SimulationRequest` guardado, que es autocontenido por diseño (ADR-03): trae la
// geometría, el diccionario de materiales y las cajas con su posición. No hace falta tocar la
// escena de hoy, y no se debe: los RT60 que justifican el tratamiento se midieron sobre ESA sala, y
// proponer paneles sobre una planta que alguien editó después daría posiciones que no corresponden
// a los números que las acompañan. Mismo criterio que resolve-treatment.ts.
//
// El acceso se resuelve SOLO por resolveProjectAccess, como manda la §9.

import { simulationRequestSchema } from "@/contracts";
import { resolveProjectAccess } from "@/features/projects/queries/resolve-project-access";
import { MIN_FOOTPRINT_VERTICES } from "@/features/room-editor/model/polygon-2d";
import {
  fromSimResults,
  type SimulationView,
} from "@/features/simulation/model/from-sim-results";
import { db } from "@/lib/db";

export type PanelInputs = {
  projectId: string;
  sceneId: string;
  sceneName: string;
  request: ReturnType<typeof simulationRequestSchema.parse>;
  view: SimulationView;
};

export type PanelInputsResult =
  | { ok: true; data: PanelInputs }
  | { ok: false; reason: "not_found" | "not_completed" | "no_room" };

export async function resolvePanelInputs(
  userId: string,
  simulationId: string,
): Promise<PanelInputsResult> {
  const simulation = await db.simulation.findUnique({
    where: { id: simulationId },
    select: {
      request: true,
      job: { select: { status: true } },
      results: { select: { kind: true, summary: true, payload: true } },
      scene: { select: { id: true, name: true, projectId: true } },
    },
  });
  if (!simulation) return { ok: false, reason: "not_found" };

  const access = await resolveProjectAccess(userId, simulation.scene.projectId);
  if (!access) return { ok: false, reason: "not_found" };

  // Sin resultados completos no hay reverberación que mitigar, y el consejo sería inventado.
  if (simulation.job?.status !== "COMPLETED") {
    return { ok: false, reason: "not_completed" };
  }

  const request = simulationRequestSchema.safeParse(simulation.request);
  if (
    !request.success ||
    request.data.room.footprint.vertices.length < MIN_FOOTPRINT_VERTICES
  ) {
    return { ok: false, reason: "no_room" };
  }

  return {
    ok: true,
    data: {
      projectId: simulation.scene.projectId,
      sceneId: simulation.scene.id,
      sceneName: simulation.scene.name,
      request: request.data,
      view: fromSimResults(simulation.results),
    },
  };
}
