// src/features/simulation/queries/compile-scene-request.ts — la escena guardada, hecha payload.
//
// Junta las tres lecturas que el compilador puro necesita y no puede hacer por sí mismo (ADR-03):
// el grafo con sus datasheets, el recinto con sus materiales resueltos, y el ambiente/config del
// panel 3D. Vive en queries/ y no dentro de la action porque la action tiene un presupuesto de 80
// líneas y esto es lectura, no decisión.
//
// Reconstruye el ResolvedFlow desde Prisma en vez de confiar en lo que mande el cliente, igual que
// save-signal-flow: una Server Action es un endpoint invocable directo.

import type { SimulationRequest } from "@/contracts";
import { parseRoom } from "@/features/room-editor/schemas/parse-room";
import type { SceneWithRole } from "@/features/scenes/queries";
import { hydrateFlow } from "@/features/signal-flow/model/resolved-flow";
import { resolveFlowCatalog } from "@/features/signal-flow/queries/resolve-flow-catalog";
import { resolveFlowElectrical } from "@/features/signal-flow/resolution/resolve-flow-electrical";
import { parseSignalFlow } from "@/features/signal-flow/schemas/signal-flow";
import { canSimulate } from "@/features/simulation/model/can-simulate";
import { toSimulationRequest } from "@/features/simulation/model/to-simulation-request";
import { resolveSceneMaterials } from "@/features/simulation/queries/resolve-scene-materials";
import { parseSceneSimulation } from "@/features/simulation/schemas/parse-scene-simulation";

export type CompiledRequest =
  | { ok: true; request: SimulationRequest }
  | { ok: false; message: string };

export async function compileSceneRequest(
  scene: SceneWithRole,
  ids: { jobId: string; simulationId: string },
): Promise<CompiledRequest> {
  const document = parseRoom(scene.room);
  const simulation = parseSceneSimulation(scene.simulation);
  const flow = parseSignalFlow(scene.signalFlow);
  if (!document.ok || !simulation.ok || !flow.ok) {
    return {
      ok: false,
      message: "La escena tiene datos que no se pueden leer.",
    };
  }

  const snapshot = await resolveFlowCatalog(flow.data);
  const electrical = resolveFlowElectrical(hydrateFlow(flow.data, snapshot));
  if (!electrical.ok) {
    return {
      ok: false,
      message: "Hay cajas del flujo que no resuelven potencia o espectro.",
    };
  }

  const readiness = canSimulate({
    sceneStatus: scene.status,
    document: document.data,
    speakerCount: electrical.sources.length,
  });
  if (!readiness.canSimulate) {
    return { ok: false, message: readiness.blockers[0].message };
  }

  const { materials, missingIds } = await resolveSceneMaterials(document.data);
  if (missingIds.length > 0) {
    // Mandar media verdad al motor daría un resultado plausible con coeficientes que nadie eligió.
    return {
      ok: false,
      message: "Hay materiales citados por el recinto que ya no existen.",
    };
  }

  return {
    ok: true,
    request: toSimulationRequest({
      ...ids,
      document: document.data,
      simulation: simulation.data,
      sources: electrical.sources,
      materials,
    }),
  };
}
