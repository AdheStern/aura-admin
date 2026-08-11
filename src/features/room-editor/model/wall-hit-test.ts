// src/features/room-editor/model/wall-hit-test.ts — qué muro (y qué punto de ese muro) hay bajo un
// clic. Lo usa la herramienta de aberturas para decidir en qué muro y a qué `x` local cae la
// ventana o puerta que el usuario está colocando; comparte proyección con distancePointToSegmentM
// pero además necesita la coordenada LOCAL a lo largo del muro, que esa función descarta.

import { projectPointOnSegmentM } from "@/features/room-editor/model/geometry-2d";
import { polygonEdges } from "@/features/room-editor/model/polygon-2d";
import { wallSurfaces } from "@/features/room-editor/model/wall-surfaces";
import type {
  Point2d,
  RoomDocument,
} from "@/features/room-editor/schemas/room-document";

export type WallHit = {
  surfaceId: string;
  /** Distancia desde el primer vértice de la arista, en metros — la `x` local del contrato. */
  localXM: number;
  lengthM: number;
};

/** null si el punto cae a más de `maxDistanceM` de cualquier muro (o si la planta no tiene ninguno). */
export function nearestWallHit(
  document: RoomDocument,
  pointM: Point2d,
  maxDistanceM: number,
): WallHit | null {
  const walls = wallSurfaces(document.surfaces);
  const edges = polygonEdges(document.footprint.vertices);

  let best: WallHit | null = null;
  let bestDistanceM = maxDistanceM;

  walls.forEach((wall, index) => {
    const edge = edges[index];
    if (!edge) return;

    const projection = projectPointOnSegmentM(pointM, edge.from, edge.to);
    if (projection.distanceM > bestDistanceM) return;

    bestDistanceM = projection.distanceM;
    best = {
      surfaceId: wall.id,
      localXM: projection.alongM,
      lengthM: Math.hypot(edge.to[0] - edge.from[0], edge.to[1] - edge.from[1]),
    };
  });

  return best;
}
