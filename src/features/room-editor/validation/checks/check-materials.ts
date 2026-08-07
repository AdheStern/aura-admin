// src/features/room-editor/validation/checks/check-materials.ts — las referencias al catálogo.
// Mismo papel que checkCatalogRefs en el flujo de señal: un id que ya no existe es error (el
// compilador no sabría qué absorción poner) y uno sin asignar es aviso, porque §5.2 acepta salir
// adelante con el material por defecto.
//
// El aviso es UNO agregado y no uno por superficie a propósito: el 2D no reparte materiales —eso es
// el editor 3D de la Fase 4— así que toda sala recién dibujada tendría seis avisos idénticos, y un
// validador que regaña seis veces por lo mismo enseña a ignorar los avisos.

import {
  type RoomIssue,
  type RoomIssueTarget,
  roomIssue,
} from "@/features/room-editor/validation/issue-codes";
import type { RoomIndex } from "@/features/room-editor/validation/room-index";

type MaterialRef = { materialId: string | null; target: RoomIssueTarget };

export function checkMaterials(index: RoomIndex): RoomIssue[] {
  const refs = materialRefs(index);
  const unassigned = refs.filter((ref) => ref.materialId === null);

  return [
    ...missingFromCatalog(index, refs),
    ...(unassigned.length === 0
      ? []
      : [
          roomIssue(
            "MATERIAL_NOT_ASSIGNED",
            `${unassigned.length} superficies sin material: se simularán con el material por defecto.`,
            { kind: "room" },
          ),
        ]),
  ];
}

function missingFromCatalog(
  index: RoomIndex,
  refs: MaterialRef[],
): RoomIssue[] {
  return refs
    .filter(
      (ref) =>
        ref.materialId !== null &&
        !index.catalog.materialIds.has(ref.materialId),
    )
    .map((ref) =>
      roomIssue(
        "MATERIAL_MISSING",
        "El material asignado ya no está en el catálogo: elige otro.",
        ref.target,
      ),
    );
}

function materialRefs(index: RoomIndex): MaterialRef[] {
  const { surfaces, obstacles, openings } = index.document;

  return [
    ...surfaces.map((surface) => ({
      materialId: surface.materialId,
      target: { kind: "surface" as const, id: surface.id },
    })),
    ...obstacles.map((obstacle) => ({
      materialId: obstacle.materialId,
      target: { kind: "obstacle" as const, id: obstacle.id },
    })),
    ...openings.map((opening) => ({
      materialId: opening.materialId,
      target: { kind: "opening" as const, id: opening.id },
    })),
  ];
}
