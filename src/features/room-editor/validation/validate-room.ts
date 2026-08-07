// src/features/room-editor/validation/validate-room.ts — el validador geométrico.
// Responde una sola pregunta: ¿esta planta describe un recinto que el motor pueda construir? Su
// veredicto es lo que mueve la escena entre FLOW_READY y ROOM_READY (Sección 08).
//
// El orden de los checks es el de lectura —la planta, sus cotas, sus superficies y luego lo que se
// apoya en ellas— y todos corren siempre: el lienzo pinta TODOS los problemas a la vez, y arreglar
// de uno en uno con una recarga entre medias sería insufrible. Los que dependen de la planta se
// callan solos cuando no es utilizable (ver room-index.ts).

import type { RoomDocument } from "@/features/room-editor/schemas/room-document";
import {
  checkFootprint,
  checkHeight,
  checkMaterials,
  checkObstacles,
  checkOpenings,
  checkSurfaces,
  checkZones,
} from "@/features/room-editor/validation/checks";
import type { RoomIssue } from "@/features/room-editor/validation/issue-codes";
import {
  buildRoomIndex,
  type RoomCatalog,
} from "@/features/room-editor/validation/room-index";

export type RoomValidation = {
  isComplete: boolean;
  errors: RoomIssue[];
  warnings: RoomIssue[];
};

const CHECKS = [
  checkFootprint,
  checkHeight,
  checkSurfaces,
  checkMaterials,
  checkZones,
  checkObstacles,
  checkOpenings,
];

export function validateRoom(
  document: RoomDocument,
  catalog: RoomCatalog,
): RoomValidation {
  const index = buildRoomIndex(document, catalog);
  const issues = CHECKS.flatMap((check) => check(index));

  const errors = issues.filter((issue) => issue.severity === "error");
  return {
    isComplete: errors.length === 0,
    errors,
    warnings: issues.filter((issue) => issue.severity === "warning"),
  };
}
