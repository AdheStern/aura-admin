// src/features/room-editor/model/snap-points.ts — snap a los puntos YA dibujados en el plano
// (esquinas del contorno, pilares, zonas), para que un muro, pilar o abertura nuevo pueda arrancar
// justo sobre un punto existente en vez de solo caer en el número de rejilla más cercano. La
// rejilla (SNAP_M en geometry-2d.ts) por sí sola no garantiza que dos puntos que el usuario quiso
// hacer coincidir terminen siendo el mismo número — dos clics junto a la misma esquina, a una escala
// de zoom alejada, pueden redondear cada uno a un paso de rejilla distinto.

import { distanceM } from "@/features/room-editor/model/geometry-2d";
import type {
  Point2d,
  RoomDocument,
} from "@/features/room-editor/schemas/room-document";

// Bastante mayor que el paso de la rejilla (0.1 m): hace falta margen para "enganchar" un punto
// existente con el pulso de un mouse a una escala de zoom alejada.
export const SNAP_POINT_DISTANCE_M = 0.25;

/** No incluye las aberturas: sus puntos son proyecciones sobre el muro que ya ocupan
 *  (opening-tool.ts resuelve eso con nearestWallHit), no vértices propios que enganchar. */
export function existingPointsM(document: RoomDocument): Point2d[] {
  return [
    ...document.footprint.vertices,
    ...document.obstacles.map((obstacle) => obstacle.at),
    ...document.zones.audience.flatMap((zone) => zone.polygon),
    ...(document.zones.stage?.polygon ?? []),
  ];
}

/** El punto existente más cercano a `pointM`, si cae a SNAP_POINT_DISTANCE_M o menos; si no, null. */
export function nearestExistingPointM(
  pointM: Point2d,
  document: RoomDocument,
): Point2d | null {
  let best: Point2d | null = null;
  let bestDistanceM = SNAP_POINT_DISTANCE_M;

  for (const candidate of existingPointsM(document)) {
    const d = distanceM(pointM, candidate);
    if (d <= bestDistanceM) {
      bestDistanceM = d;
      best = candidate;
    }
  }
  return best;
}
