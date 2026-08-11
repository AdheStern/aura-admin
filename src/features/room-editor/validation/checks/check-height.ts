// src/features/room-editor/validation/checks/check-height.ts — la dimensión vertical.
// El editor 2D no dibuja alturas, las teclea, así que aquí no hay geometría: solo las tres cotas
// que tienen que ser coherentes entre sí para que la grilla de escucha caiga dentro del recinto.

import {
  type RoomIssue,
  roomIssue,
} from "@/features/room-editor/validation/issue-codes";
import type { RoomIndex } from "@/features/room-editor/validation/room-index";

// Horquilla de salas reales: por debajo de 2 m no se está de pie y por encima de 30 m ya es un
// pabellón. Fuera de ella se avisa, no se bloquea — la sala rara existe y se puede simular.
const USUAL_HEIGHT_RANGE_M = [2, 30] as const;

export function checkHeight(index: RoomIndex): RoomIssue[] {
  const heightM = index.document.height.h;

  return [
    ...unusualHeight(heightM),
    ...earHeights(index, heightM),
    ...stageElevation(index, heightM),
  ];
}

function unusualHeight(heightM: number): RoomIssue[] {
  const [minM, maxM] = USUAL_HEIGHT_RANGE_M;
  return heightM >= minM && heightM <= maxM
    ? []
    : [
        roomIssue(
          "ROOM_HEIGHT_UNUSUAL",
          `Altura de ${heightM} m: fuera de lo habitual (${minM}–${maxM} m). Comprueba que no sea un error de tecleo.`,
          { kind: "room" },
        ),
      ];
}

function earHeights(index: RoomIndex, heightM: number): RoomIssue[] {
  return index.document.zones.audience
    .filter((zone) => zone.earHeight >= heightM)
    .map((zone) =>
      roomIssue(
        "EAR_HEIGHT_ABOVE_CEILING",
        `La altura de oído (${zone.earHeight} m) llega al techo (${heightM} m): no habría dónde calcular.`,
        { kind: "zone", id: zone.id },
      ),
    );
}

function stageElevation(index: RoomIndex, heightM: number): RoomIssue[] {
  const stage = index.document.zones.stage;
  if (!stage || stage.elevation < heightM) return [];

  return [
    roomIssue(
      "STAGE_ELEVATION_ABOVE_CEILING",
      `El escenario está a ${stage.elevation} m y el techo a ${heightM} m.`,
      { kind: "zone", id: stage.id },
    ),
  ];
}
