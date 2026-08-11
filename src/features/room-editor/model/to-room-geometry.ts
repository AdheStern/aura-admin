// src/features/room-editor/model/to-room-geometry.ts — compilador RoomDocument → RoomGeometry v1.
//
// PRECONDICIÓN: el documento ya pasó validateRoom sin errores. Este módulo no valida; traduce. Lo
// llama quien arma el SimulationRequest, y llamarlo sobre un documento incompleto produce un objeto
// que el contrato rechazará al parsear (mínimo de vértices, mínimo de una zona de audiencia).
//
// Aquí es donde las dos identidades de un muro se juntan: dentro del documento el id es estable y
// arbitrario (`wall_7` puede ser la tercera arista), y en el contrato manda el ORDEN, así que se
// renumeran a wall_0..wall_n-1 en orden de arista y las aberturas se remapean en la misma pasada.
// La orientación no se toca: el documento ya es CCW porque el comando setFootprint lo normaliza.

import type { RoomGeometry } from "@/contracts/room-geometry.schema";
import { wallSurfaces } from "@/features/room-editor/model/wall-surfaces";
import type {
  RoomDocument,
  RoomObstacle,
  RoomOpening,
} from "@/features/room-editor/schemas/room-document";
import { wallSurfaceId } from "@/features/room-editor/schemas/surface-ids";

export type RoomGeometryOptions = {
  /** Material de las superficies sin asignar. Lo elige quien compila; aquí no se consulta catálogo. */
  defaultMaterialId: string;
};

export function toRoomGeometry(
  document: RoomDocument,
  { defaultMaterialId }: RoomGeometryOptions,
): RoomGeometry {
  const wallIdByDocumentId = renumberWalls(document);
  const material = (materialId: string | null) =>
    materialId ?? defaultMaterialId;

  return {
    schemaVersion: "1",
    units: "m",
    footprint: { vertices: document.footprint.vertices },
    height: { type: "flat", h: document.height.h },
    surfaces: document.surfaces.map((surface) => ({
      id: wallIdByDocumentId.get(surface.id) ?? surface.id,
      type: surface.type,
      materialId: material(surface.materialId),
    })),
    obstacles: document.obstacles.map((obstacle) =>
      toContractObstacle(obstacle, material(obstacle.materialId)),
    ),
    openings: document.openings.map((opening) =>
      toContractOpening(
        opening,
        wallIdByDocumentId,
        material(opening.materialId),
      ),
    ),
    zones: {
      ...(document.zones.stage
        ? {
            stage: {
              polygon: document.zones.stage.polygon,
              elevation: document.zones.stage.elevation,
            },
          }
        : {}),
      audience: document.zones.audience.map((zone) => ({
        polygon: zone.polygon,
        earHeight: zone.earHeight,
        seated: zone.seated,
      })),
    },
  };
}

function renumberWalls(document: RoomDocument): Map<string, string> {
  return new Map(
    wallSurfaces(document.surfaces).map((wall, index) => [
      wall.id,
      wallSurfaceId(index),
    ]),
  );
}

function toContractObstacle(
  obstacle: RoomObstacle,
  materialId: string,
): RoomGeometry["obstacles"][number] {
  const base = {
    id: obstacle.id,
    type: obstacle.type,
    at: obstacle.at,
    materialId,
  };
  return obstacle.shape === "rect"
    ? { ...base, shape: "rect", size: obstacle.size }
    : { ...base, shape: "circle", size: obstacle.size };
}

function toContractOpening(
  opening: RoomOpening,
  wallIdByDocumentId: ReadonlyMap<string, string>,
  materialId: string,
): RoomGeometry["openings"][number] {
  return {
    id: opening.id,
    type: opening.type,
    surfaceId: wallIdByDocumentId.get(opening.surfaceId) ?? opening.surfaceId,
    rect: opening.rect,
    materialId,
  };
}
