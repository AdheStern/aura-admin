// src/features/simulation/model/to-simulation-request.ts — compilador del payload (ADR-03).
//
// Función PURA: recibe todo ya leído y resuelto y no consulta nada. Esa es la mitad de ADR-03 — el
// motor no toca la BD porque el payload trae la geometría, los materiales y los datasheets dentro,
// y por eso mismo el mismo payload da el mismo resultado y se puede cachear por su hash.
//
// Cada pieza la produce quien ya sabía hacerla, y aquí solo se juntan: toRoomGeometry compila el
// recinto y renumera los muros, resolveSpeakerPlacements dice dónde está cada caja, y
// resolveFlowElectrical (Fase 2) trae potencia y espectro de programa. El único trabajo propio es
// el JOIN por nodeId entre "qué caja es" (grafo) y "dónde está" (recinto), que es exactamente la
// frontera que declara la cabecera de resolve-flow-electrical.ts.

import type { MaterialSpec } from "@/contracts/material-spec.schema";
import type {
  SimulationRequest,
  SimulationSource,
} from "@/contracts/simulation-request.schema";
import { resolveSpeakerPlacements } from "@/features/room-editor/model/speaker-placement";
import { toRoomGeometry } from "@/features/room-editor/model/to-room-geometry";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";
import type { ResolvedSpeakerSource } from "@/features/signal-flow/resolution/resolve-flow-electrical";
import type { SceneSimulation } from "@/features/simulation/schemas/scene-simulation";

export type SimulationRequestInput = {
  /** Los genera quien encola (Fase 5); el compilador no inventa identidad. */
  jobId: string;
  simulationId: string;
  document: RoomDocument;
  simulation: SceneSimulation;
  /** En el orden del grafo: el mismo que tendrá `sources` y el que resuelve las colocaciones. */
  sources: readonly ResolvedSpeakerSource[];
  /** Cada materialId citado por la geometría, ya resuelto a su datasheet. */
  materials: Record<string, MaterialSpec>;
};

export function toSimulationRequest({
  jobId,
  simulationId,
  document,
  simulation,
  sources,
  materials,
}: SimulationRequestInput): SimulationRequest {
  const room = toRoomGeometry(document, {
    // El compilador no rellena huecos: canSimulate() ya exigió que toda superficie tenga material,
    // así que este valor no llega a usarse nunca. Inventar un material por defecto aquí sería
    // simular con coeficientes que nadie eligió, justo lo que prohíbe la "precisión honesta".
    defaultMaterialId: UNASSIGNED_MATERIAL_ID,
  });
  const placements = resolveSpeakerPlacements(
    document,
    sources.map((source) => source.nodeId),
  );

  return {
    schemaVersion: "1",
    jobId,
    simulationId,
    config: simulation.config,
    environment: simulation.environment,
    room,
    materials,
    sources: sources.map((source, index) =>
      toSource(source, placements[index]),
    ),
  };
}

/** Solo aparecería en el payload si se compilara saltándose canSimulate(), y el contrato lo
 *  rechazaría igual porque este id no está en `materials`. Es un centinela, no un material. */
const UNASSIGNED_MATERIAL_ID = "__sin_material__";

function toSource(
  source: ResolvedSpeakerSource,
  placement: {
    position: [number, number, number];
    rotationDeg: SimulationSource["rotationDeg"];
  },
): SimulationSource {
  return {
    id: source.nodeId,
    catalogRef: source.catalogRef,
    position: placement.position,
    rotationDeg: placement.rotationDeg,
    levelDb: source.levelDb,
    polarityInverted: source.polarityInverted,
    delayMs: source.delayMs,
    electricalPowerW: source.electricalPowerW,
    spec: source.spec,
    programSpectrum: source.programSpectrum,
  };
}
