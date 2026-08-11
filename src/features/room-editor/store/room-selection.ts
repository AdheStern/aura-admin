// src/features/room-editor/store/room-selection.ts — qué figura del lienzo está elegida.
//
// Zona de escenario y zonas de audiencia comparten variante ("zone"): ambas son RoomZone-shaped con
// id propio (roomStageSchema y roomZoneSchema declaran el mismo campo), así que distinguirlas exige
// mirar el documento, no el tipo de selección — findZone hace exactamente eso.

import type {
  RoomDocument,
  RoomStage,
  RoomZone,
} from "@/features/room-editor/schemas/room-document";
import type { RoomIssueTarget } from "@/features/room-editor/validation/issue-codes";

export type RoomSelection =
  | { kind: "vertex"; index: number }
  | { kind: "surface"; id: string }
  | { kind: "obstacle"; id: string }
  | { kind: "opening"; id: string }
  | { kind: "zone"; id: string }
  /** `id` es el nodeId del grafo. Solo se puede elegir desde el editor 3D: en la planta cenital una
   *  caja es un punto sin superficie a la que apuntar, y su altura —lo que de verdad se ajusta— no
   *  se ve. */
  | { kind: "speaker"; id: string };

/** Selecciona lo que señala un RoomIssue al hacer click sobre él en el panel de validación. */
export function selectionFromIssueTarget(
  target: RoomIssueTarget,
): RoomSelection | null {
  switch (target.kind) {
    case "vertex":
      return { kind: "vertex", index: target.index };
    case "surface":
      return { kind: "surface", id: target.id };
    case "obstacle":
      return { kind: "obstacle", id: target.id };
    case "opening":
      return { kind: "opening", id: target.id };
    case "zone":
      return { kind: "zone", id: target.id };
    case "speaker":
      return { kind: "speaker", id: target.id };
    default:
      return null;
  }
}

export type ResolvedZone =
  | { origin: "stage"; zone: RoomStage }
  | { origin: "audience"; zone: RoomZone; index: number };

export function findZone(
  document: RoomDocument,
  id: string,
): ResolvedZone | null {
  if (document.zones.stage?.id === id) {
    return { origin: "stage", zone: document.zones.stage };
  }
  const index = document.zones.audience.findIndex((zone) => zone.id === id);
  return index === -1
    ? null
    : { origin: "audience", zone: document.zones.audience[index], index };
}
