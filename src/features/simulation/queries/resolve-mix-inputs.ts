// src/features/simulation/queries/resolve-mix-inputs.ts — todo lo que hace falta para pedir consejo.
//
// Junta las dos mitades que viven en sitios distintos: la física, congelada en las filas SimResult
// de la simulación, y los instrumentos, que solo existen en el grafo de HOY de la escena. Va en una
// query y no en la action para que ésta se quede en lo suyo —autorizar, llamar y validar— y no pase
// de las 80 líneas.
//
// El acceso se resuelve SOLO por resolveProjectAccess, como manda la §9: pedir consejo lee la
// escena entera, así que exige el mismo permiso que abrir los resultados.

import { resolveProjectAccess } from "@/features/projects/queries/resolve-project-access";
import { parseSignalFlow } from "@/features/signal-flow/schemas/signal-flow";
import {
  fromSimResults,
  type SimulationView,
} from "@/features/simulation/model/from-sim-results";
import {
  type CatalogSourceRow,
  describeInstruments,
  type SceneInstrument,
  sourceNodesOf,
} from "@/features/simulation/model/scene-instruments";
import { db } from "@/lib/db";

export type MixInputs = {
  projectId: string;
  sceneId: string;
  sceneName: string;
  view: SimulationView;
  instruments: SceneInstrument[];
};

export type MixInputsResult =
  | { ok: true; data: MixInputs }
  | { ok: false; reason: "not_found" | "not_completed" | "no_instruments" };

export async function resolveMixInputs(
  userId: string,
  simulationId: string,
): Promise<MixInputsResult> {
  const simulation = await db.simulation.findUnique({
    where: { id: simulationId },
    select: {
      job: { select: { status: true } },
      results: { select: { kind: true, summary: true, payload: true } },
      scene: {
        select: { id: true, name: true, projectId: true, signalFlow: true },
      },
    },
  });
  if (!simulation) return { ok: false, reason: "not_found" };

  const access = await resolveProjectAccess(userId, simulation.scene.projectId);
  if (!access) return { ok: false, reason: "not_found" };

  // Sin resultados completos no hay física que resumir, y un consejo sobre nada sería inventado.
  if (simulation.job?.status !== "COMPLETED") {
    return { ok: false, reason: "not_completed" };
  }

  const flow = parseSignalFlow(simulation.scene.signalFlow);
  const nodes = flow.ok ? sourceNodesOf(flow.data) : [];
  if (nodes.length === 0) return { ok: false, reason: "no_instruments" };

  const rows = await db.catalogSource.findMany({
    where: { id: { in: nodes.map((node) => node.catalogItemId) } },
    select: { id: true, name: true, category: true, spec: true },
  });

  const instruments = describeInstruments(nodes, rows as CatalogSourceRow[]);
  if (instruments.length === 0) return { ok: false, reason: "no_instruments" };

  return {
    ok: true,
    data: {
      projectId: simulation.scene.projectId,
      sceneId: simulation.scene.id,
      sceneName: simulation.scene.name,
      view: fromSimResults(simulation.results),
      instruments,
    },
  };
}
