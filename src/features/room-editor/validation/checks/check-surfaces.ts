// src/features/room-editor/validation/checks/check-surfaces.ts — estructura de las superficies.
// Los tres problemas que mira son redes de bugs, no errores del usuario: piso y techo existen desde
// el documento vacío y el número de muros lo mantienen los comandos del footprint. Si alguno salta,
// el documento se editó sin pasar por el historial y compilarlo daría materiales en muros ajenos.

import {
  type RoomIssue,
  roomIssue,
} from "@/features/room-editor/validation/issue-codes";
import type { RoomIndex } from "@/features/room-editor/validation/room-index";

export function checkSurfaces(index: RoomIndex): RoomIssue[] {
  return [...missingSurfaces(index), ...wallCount(index)];
}

function missingSurfaces(index: RoomIndex): RoomIssue[] {
  return (["floor", "ceiling"] as const)
    .filter((type) => !index.document.surfaces.some((s) => s.type === type))
    .map((type) =>
      roomIssue(
        "SURFACE_MISSING",
        `Falta la superficie de ${type === "floor" ? "piso" : "techo"} en el documento.`,
        { kind: "room" },
      ),
    );
}

function wallCount(index: RoomIndex): RoomIssue[] {
  const edgeCount = index.footprint.length;
  if (edgeCount < 3 || index.walls.length === edgeCount) return [];

  return [
    roomIssue(
      "WALL_SURFACE_MISMATCH",
      `La planta tiene ${edgeCount} aristas y el documento ${index.walls.length} muros: no se puede saber qué material va en cuál.`,
      { kind: "footprint" },
    ),
  ];
}
