// src/features/simulation/model/apply-speaker-orientation.ts — llevar una recomendación al recinto.
//
// CoverageGapRule propone yaw y pitch para UNA caja (`reposition_speaker`). Aplicarla es escribir
// esos dos ángulos en su colocación, y nada más: el roll y la posición se quedan como están porque
// la regla no los propone — moverlos sería inventar parte de la recomendación.
//
// `document.speakers` es PARCIAL a propósito (ver speaker-placement.ts): solo guarda las cajas que
// el usuario tocó. Aplicar sobre una caja nunca movida tiene que materializar su colocación, y para
// eso hace falta una posición; se usa la que el motor tenía delante al calcular la propuesta, que
// viene en el `SimulationRequest` congelado de esa simulación.

import type {
  RoomDocument,
  RoomSpeaker,
} from "@/features/room-editor/schemas/room-document";

export type ProposedOrientation = { yawDeg: number; pitchDeg: number };

export function applySpeakerOrientation(
  document: RoomDocument,
  nodeId: string,
  proposed: ProposedOrientation,
  /** Colocación que usó el motor: solo se lee si la caja no está en el documento. */
  simulated: Pick<RoomSpeaker, "position" | "rotationDeg">,
): RoomDocument {
  const stored = document.speakers.find((speaker) => speaker.nodeId === nodeId);
  const base = stored ?? { nodeId, ...simulated };

  const next: RoomSpeaker = {
    ...base,
    nodeId,
    rotationDeg: {
      ...base.rotationDeg,
      yaw: proposed.yawDeg,
      pitch: proposed.pitchDeg,
    },
  };

  return {
    ...document,
    speakers: stored
      ? document.speakers.map((speaker) =>
          speaker.nodeId === nodeId ? next : speaker,
        )
      : [...document.speakers, next],
  };
}
