// src/features/simulation/queries/get-simulation-view.ts — todo lo que la vista de resultados pinta.
//
// Trae también el `requestHash` guardado: comparado con el de la escena de HOY dice si lo que se ve
// sigue describiendo lo que hay. La §08 pide marcar los resultados como desactualizados y no
// borrarlos nunca, y esa comparación es lo único que hace falta para saberlo.

import { simulationConfigSchema } from "@/contracts";
import { resolveProjectAccess } from "@/features/projects/queries/resolve-project-access";
import { parseRoom } from "@/features/room-editor/schemas/parse-room";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";
import {
  fromSimResults,
  type SimulationView,
} from "@/features/simulation/model/from-sim-results";
import { db } from "@/lib/db";
import type { EngineJobStatus, JobError } from "@/lib/engine-client.types";

export type SimulationDetail = {
  simulationId: string;
  sceneId: string;
  sceneName: string;
  projectId: string;
  createdAt: Date;
  requestHash: string;
  /** Paso de la grilla: el lado de cada celda del mapa, en metros. */
  resolutionM: number;
  /** El recinto de HOY, solo para dibujar la planta bajo el mapa. */
  document: RoomDocument | null;
  job: { status: EngineJobStatus; progress: number; error: JobError | null };
  view: SimulationView;
};

const FALLBACK_RESOLUTION_M = 1;

/** null → no existe o no hay acceso: la página hace notFound() en ambos casos. */
export async function getSimulationView(
  userId: string,
  simulationId: string,
): Promise<SimulationDetail | null> {
  const simulation = await db.simulation.findUnique({
    where: { id: simulationId },
    select: {
      id: true,
      createdAt: true,
      requestHash: true,
      config: true,
      job: { select: { status: true, progress: true, error: true } },
      results: { select: { kind: true, summary: true, payload: true } },
      scene: { select: { id: true, name: true, projectId: true, room: true } },
    },
  });
  if (!simulation) return null;

  const access = await resolveProjectAccess(userId, simulation.scene.projectId);
  if (!access) return null;

  const config = simulationConfigSchema.safeParse(simulation.config);
  const document = parseRoom(simulation.scene.room);

  return {
    simulationId: simulation.id,
    sceneId: simulation.scene.id,
    sceneName: simulation.scene.name,
    projectId: simulation.scene.projectId,
    createdAt: simulation.createdAt,
    requestHash: simulation.requestHash,
    resolutionM: config.success
      ? config.data.grid.resolutionM
      : FALLBACK_RESOLUTION_M,
    document: document.ok ? document.data : null,
    job: {
      status: (simulation.job?.status ?? "QUEUED") as EngineJobStatus,
      progress: simulation.job?.progress ?? 0,
      error: (simulation.job?.error as JobError | null) ?? null,
    },
    view: fromSimResults(simulation.results),
  };
}
