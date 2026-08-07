// src/features/room-editor/validation/checks/check-openings.ts — ventanas y puertas.
// El `rect` de una abertura es local a su muro (x desde el primer vértice de la arista, y desde el
// piso), así que comprobar que "cabe" exige el largo de esa arista concreta: por eso todo lo de aquí
// depende de que la planta sea utilizable.

import { EPSILON_M } from "@/features/room-editor/model/geometry-2d";
import { wallLengthM } from "@/features/room-editor/model/wall-surfaces";
import type { RoomOpening } from "@/features/room-editor/schemas/room-document";
import {
  type RoomIssue,
  roomIssue,
} from "@/features/room-editor/validation/issue-codes";
import type { RoomIndex } from "@/features/room-editor/validation/room-index";

// Por encima de esta fracción el muro es más hueco que muro: su absorción la manda el vidrio, no el
// material declarado, y la aproximación de v1 (la abertura no perfora la malla, solo cambia el
// material del área) empieza a mentir.
const MAX_OPEN_AREA_RATIO = 0.6;

export function checkOpenings(index: RoomIndex): RoomIssue[] {
  return [
    ...danglingSurfaces(index),
    ...outOfBounds(index),
    ...overlaps(index),
    ...excessiveArea(index),
  ];
}

function danglingSurfaces(index: RoomIndex): RoomIssue[] {
  return index.document.openings
    .filter(
      (opening) => !index.walls.some((wall) => wall.id === opening.surfaceId),
    )
    .map((opening) =>
      roomIssue(
        "OPENING_SURFACE_MISSING",
        "La abertura está en un muro que ya no existe: bórrala o muévela a otro.",
        { kind: "opening", id: opening.id },
      ),
    );
}

function outOfBounds(index: RoomIndex): RoomIssue[] {
  if (!index.isFootprintUsable) return [];
  const heightM = index.document.height.h;

  return index.document.openings.flatMap((opening) => {
    const lengthM = wallLengthM(index.shell, opening.surfaceId);
    if (lengthM === null) return [];

    const [x, y, widthM, openingHeightM] = opening.rect;
    const fits =
      x >= -EPSILON_M &&
      y >= -EPSILON_M &&
      x + widthM <= lengthM + EPSILON_M &&
      y + openingHeightM <= heightM + EPSILON_M;

    return fits
      ? []
      : [
          roomIssue(
            "OPENING_OUT_OF_BOUNDS",
            `La abertura (${widthM}×${openingHeightM} m en x=${x}, y=${y}) no cabe en un muro de ${lengthM.toFixed(2)}×${heightM} m.`,
            { kind: "opening", id: opening.id },
          ),
        ];
  });
}

function overlaps(index: RoomIndex): RoomIssue[] {
  const issues: RoomIssue[] = [];

  for (const [position, opening] of index.document.openings.entries()) {
    for (const other of index.document.openings.slice(position + 1)) {
      if (other.surfaceId !== opening.surfaceId) continue;
      if (!doRectsOverlap(opening.rect, other.rect)) continue;
      issues.push(
        roomIssue(
          "OPENINGS_OVERLAP",
          "Dos aberturas se pisan en el mismo muro: su área se contaría dos veces.",
          { kind: "opening", id: opening.id },
        ),
      );
    }
  }
  return issues;
}

function excessiveArea(index: RoomIndex): RoomIssue[] {
  if (!index.isFootprintUsable) return [];
  const heightM = index.document.height.h;

  return index.walls.flatMap((wall) => {
    const lengthM = wallLengthM(index.shell, wall.id) ?? 0;
    const wallAreaM2 = lengthM * heightM;
    if (wallAreaM2 <= 0) return [];

    const openAreaM2 = index.document.openings
      .filter((opening) => opening.surfaceId === wall.id)
      .reduce((sum, opening) => sum + opening.rect[2] * opening.rect[3], 0);

    const ratio = openAreaM2 / wallAreaM2;
    return ratio <= MAX_OPEN_AREA_RATIO
      ? []
      : [
          roomIssue(
            "OPENING_AREA_EXCESSIVE",
            `El ${Math.round(ratio * 100)} % del muro son aberturas: revisa si no es una pared de vidrio.`,
            { kind: "surface", id: wall.id },
          ),
        ];
  });
}

function doRectsOverlap(
  a: RoomOpening["rect"],
  b: RoomOpening["rect"],
): boolean {
  return (
    a[0] < b[0] + b[2] &&
    b[0] < a[0] + a[2] &&
    a[1] < b[1] + b[3] &&
    b[1] < a[1] + a[3]
  );
}
