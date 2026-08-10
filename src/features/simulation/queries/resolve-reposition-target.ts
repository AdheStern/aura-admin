// src/features/simulation/queries/resolve-reposition-target.ts — qué caja mover y adónde.
//
// La propuesta se relee de la BD por su id en vez de aceptarla del cliente. No es por privilegios
// —quien puede aplicar ya puede editar el recinto a mano— sino porque así "aplicar" significa
// exactamente lo que el motor calculó, y no unos ángulos parecidos que viajaron por el camino.

import { z } from "zod";
import { simulationRequestSchema } from "@/contracts";
import type { RoomSpeaker } from "@/features/room-editor/schemas/room-document";
import { repositionActionSchema } from "@/features/simulation/schemas/reposition-action";
import { db } from "@/lib/db";

export type RepositionTarget = {
  sceneId: string;
  projectId: string;
  nodeId: string;
  proposed: { yawDeg: number; pitchDeg: number };
  /** La colocación con la que corrió el motor: el respaldo si la caja no está en el documento. */
  simulated: Pick<RoomSpeaker, "position" | "rotationDeg">;
};

export type RepositionLookup =
  | { ok: true; target: RepositionTarget }
  | { ok: false; reason: "not_found" | "not_applicable" };

export async function resolveRepositionTarget(
  simulationId: string,
  recommendationId: string,
): Promise<RepositionLookup> {
  const simulation = await db.simulation.findUnique({
    where: { id: simulationId },
    select: {
      request: true,
      scene: { select: { id: true, projectId: true } },
      results: {
        where: { kind: "RECOMMENDATIONS" },
        select: { payload: true },
      },
    },
  });
  if (!simulation) return { ok: false, reason: "not_found" };

  const action = findAction(simulation.results[0]?.payload, recommendationId);
  const request = simulationRequestSchema.safeParse(simulation.request);
  if (!action || !request.success)
    return { ok: false, reason: "not_applicable" };

  const source = request.data.sources.find(
    (item) => item.id === action.sourceId,
  );
  if (!source) return { ok: false, reason: "not_applicable" };

  return {
    ok: true,
    target: {
      sceneId: simulation.scene.id,
      projectId: simulation.scene.projectId,
      nodeId: action.sourceId,
      proposed: action.proposed,
      simulated: { position: source.position, rotationDeg: source.rotationDeg },
    },
  };
}

const storedRecommendationsSchema = z.array(
  z.looseObject({ id: z.string(), action: z.unknown() }),
);

function findAction(payload: unknown, recommendationId: string) {
  const stored = storedRecommendationsSchema.safeParse(payload);
  if (!stored.success) return null;

  const found = stored.data.find((item) => item.id === recommendationId);
  const action = repositionActionSchema.safeParse(found?.action);
  return action.success ? action.data : null;
}
