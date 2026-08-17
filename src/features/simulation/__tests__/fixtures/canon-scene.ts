// src/features/simulation/__tests__/fixtures/canon-scene.ts — la escena de CANON-01 armada con las
// herramientas reales del editor, para poder compilarla en un test.
//
// Vive aquí y no dentro de un `.test.ts` porque la usan dos: el que comprueba que el payload
// reproduce la fixture del contrato, y el que mide cuánto tarda en compilarse. Reconstruirla dos
// veces las dejaría derivar, y entonces una de las dos ya no estaría midiendo CANON-01.

import canonRequest from "@/contracts/fixtures/canon-01.request.json";
import type { MaterialSpec } from "@/contracts/material-spec.schema";
import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";
import {
  audienceZone,
  buildRoom,
  rectVertices,
} from "@/features/room-editor/__tests__/fixtures/room-builder";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";
import type { ResolvedSpeakerSource } from "@/features/signal-flow/resolution/resolve-flow-electrical";
import { toSimulationRequest } from "@/features/simulation/model/to-simulation-request";
import {
  type SceneSimulation,
  sceneSimulationSchema,
} from "@/features/simulation/schemas/scene-simulation";

export const CANON_MATERIAL_ID = "mat_canon";
export const CANON_SPEC = canonRequest.sources[0]
  .spec as unknown as SpeakerSpec;
export const CANON_MATERIAL = canonRequest.materials
  .mat_canon as unknown as MaterialSpec;

/** La sala de CANON-01 (§A.1): 20 × 12 × 6 m, α = 0.10 uniforme, audiencia en toda la planta. */
export function canonDocument(): RoomDocument {
  const vertices = rectVertices(20, 12);
  const document = buildRoom(
    { kind: "setFootprint", vertices },
    { kind: "setHeight", heightM: 6 },
    {
      kind: "insertAudienceZone",
      index: 0,
      zone: audienceZone("zone_1", vertices),
    },
  );

  // La fuente de CANON-01 está en (1, 6, 4) apuntando a +X, que es yaw 0.
  return {
    ...document,
    surfaces: document.surfaces.map((surface) => ({
      ...surface,
      materialId: CANON_MATERIAL_ID,
    })),
    speakers: [
      {
        nodeId: "spk_1",
        position: [1, 6, 4],
        rotationDeg: { yaw: 0, pitch: 0, roll: 0 },
      },
    ],
  };
}

export const canonSource: ResolvedSpeakerSource = {
  nodeId: "spk_1",
  catalogRef: "CatalogSpeaker:canon-01",
  spec: CANON_SPEC,
  electricalPowerW: 100,
  programSpectrum: "flat_reference",
  levelDb: 0,
  polarityInverted: false,
  delayMs: 0,
};

export const canonSimulation: SceneSimulation = sceneSimulationSchema.parse({
  environment: canonRequest.environment,
  config: canonRequest.config,
});

export const compileCanon = () =>
  toSimulationRequest({
    jobId: "job_canon01",
    simulationId: "sim_canon01",
    document: canonDocument(),
    simulation: canonSimulation,
    sources: [canonSource],
    materials: { [CANON_MATERIAL_ID]: CANON_MATERIAL },
  });
