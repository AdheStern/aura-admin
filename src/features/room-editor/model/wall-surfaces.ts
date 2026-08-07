// src/features/room-editor/model/wall-surfaces.ts — mantiene la correspondencia muro↔arista.
//
// CONVENCIÓN (cabecera de src/contracts/room-geometry.schema.ts): el k-ésimo muro de `surfaces` es
// la arista k del footprint, vértice k → k+1. Dentro del documento el muro se identifica por su id
// —las aberturas lo referencian— y esa es justo la razón por la que editar el footprint no puede
// ser "regenerar la lista": partir una arista tiene que conservar los ids de las demás o cada
// ventana acabaría en un muro distinto del que el usuario la puso.
//
// Las tres listas afectadas viajan juntas como `RoomShell` porque una operación que toca una toca
// las tres, y separarlas dejaría documentos intermedios incoherentes.

import { edgeLengthM } from "@/features/room-editor/model/polygon-2d";
import type {
  Polygon2d,
  RoomDocument,
  RoomOpening,
  RoomSurface,
} from "@/features/room-editor/schemas/room-document";
import { nextWallId } from "@/features/room-editor/schemas/surface-ids";

export type RoomShell = {
  vertices: Polygon2d;
  surfaces: RoomSurface[];
  openings: RoomOpening[];
};

export function shellOf(document: RoomDocument): RoomShell {
  return {
    vertices: document.footprint.vertices,
    surfaces: document.surfaces,
    openings: document.openings,
  };
}

export function withShell(
  document: RoomDocument,
  shell: RoomShell,
): RoomDocument {
  return {
    ...document,
    footprint: { vertices: shell.vertices },
    surfaces: shell.surfaces,
    openings: shell.openings,
  };
}

export function wallSurfaces(surfaces: readonly RoomSurface[]): RoomSurface[] {
  return surfaces.filter((surface) => surface.type === "wall");
}

/** Índice de arista del muro, o null si el id no es de ningún muro (abertura colgante). */
export function wallEdgeIndexOf(
  surfaces: readonly RoomSurface[],
  surfaceId: string,
): number | null {
  const index = wallSurfaces(surfaces).findIndex(
    (surface) => surface.id === surfaceId,
  );
  return index === -1 ? null : index;
}

export function wallLengthM(
  shell: RoomShell,
  surfaceId: string,
): number | null {
  const index = wallEdgeIndexOf(shell.surfaces, surfaceId);
  return index === null ? null : edgeLengthM(shell.vertices, index);
}

/**
 * Footprint nuevo de arriba abajo (cierre de la polilínea, herramienta de rectángulo).
 *
 * Los muros se conservan por posición hasta donde alcanzan: redibujar una planta de cuatro lados
 * como otra de cuatro lados no debería perder los materiales ya asignados. Las aberturas de un
 * muro que ya no existe se caen — de ahí que el inverso de este comando sea un `setShell`.
 */
export function setFootprintShell(
  shell: RoomShell,
  vertices: Polygon2d,
): RoomShell {
  const previousWalls = wallSurfaces(shell.surfaces);
  const walls: RoomSurface[] = [];

  for (let index = 0; index < vertices.length; index++) {
    walls.push(previousWalls[index] ?? newWall(walls, previousWalls));
  }
  return rebuild(shell, vertices, walls);
}

/** Parte la arista `edgeIndex`: el muro nuevo queda en `edgeIndex + 1` y el original se acorta. */
export function splitWallShell(
  shell: RoomShell,
  edgeIndex: number,
  vertices: Polygon2d,
): RoomShell {
  const walls = wallSurfaces(shell.surfaces);
  const inserted = newWall(walls, []);

  return rebuild(shell, vertices, [
    ...walls.slice(0, edgeIndex + 1),
    inserted,
    ...walls.slice(edgeIndex + 1),
  ]);
}

/**
 * Quita el vértice `vertexIndex`: sus dos aristas se funden en una.
 *
 * Sobrevive el muro `vertexIndex - 1` (con su material y sus aberturas) y desaparece el
 * `vertexIndex`, que es exactamente "la lista de muros menos ese índice" también cuando se borra
 * el vértice 0 y la arista fundida da la vuelta al final de la lista.
 */
export function mergeWallShell(
  shell: RoomShell,
  vertexIndex: number,
  vertices: Polygon2d,
): RoomShell {
  const walls = wallSurfaces(shell.surfaces);
  return rebuild(
    shell,
    vertices,
    walls.filter((_, index) => index !== vertexIndex),
  );
}

function rebuild(
  shell: RoomShell,
  vertices: Polygon2d,
  walls: RoomSurface[],
): RoomShell {
  const liveWallIds = new Set(walls.map((wall) => wall.id));

  return {
    vertices,
    // Piso y techo primero: el orden de los muros es lo único que el contrato lee, y fijar el resto
    // hace que dos documentos con la misma geometría se serialicen igual.
    surfaces: [
      ...shell.surfaces.filter((surface) => surface.type !== "wall"),
      ...walls,
    ],
    openings: shell.openings.filter((opening) =>
      liveWallIds.has(opening.surfaceId),
    ),
  };
}

function newWall(
  created: readonly RoomSurface[],
  previous: readonly RoomSurface[],
): RoomSurface {
  return {
    id: nextWallId([...previous, ...created]),
    type: "wall",
    materialId: null,
  };
}
