// src/features/room-editor/model/obstacle-geometry.ts — los pilares como geometría en planta.
// El contrato no da rotación: el pilar rectangular está alineado a los ejes y `at` es su CENTRO,
// no su esquina. Esa es la única lectura que hace este módulo; el resto es distancia pura.

import {
  arePointsEqual,
  distanceM,
  EPSILON_M,
} from "@/features/room-editor/model/geometry-2d";
import {
  distancePointToPolygonM,
  pointInPolygon,
  polygonsOverlap,
} from "@/features/room-editor/model/polygon-topology";
import type {
  Polygon2d,
  RoomObstacle,
} from "@/features/room-editor/schemas/room-document";

/** Contorno del pilar rectangular; los circulares no se poligonizan (se resuelven por distancia). */
export function rectObstacleOutline(
  obstacle: Extract<RoomObstacle, { shape: "rect" }>,
): Polygon2d {
  const [centerX, centerY] = obstacle.at;
  const [halfWidth, halfDepth] = [obstacle.size[0] / 2, obstacle.size[1] / 2];

  return [
    [centerX - halfWidth, centerY - halfDepth],
    [centerX + halfWidth, centerY - halfDepth],
    [centerX + halfWidth, centerY + halfDepth],
    [centerX - halfWidth, centerY + halfDepth],
  ];
}

export function obstacleAreaM2(obstacle: RoomObstacle): number {
  return obstacle.shape === "rect"
    ? obstacle.size[0] * obstacle.size[1]
    : Math.PI * obstacle.size[0] ** 2;
}

/** Tangente cuenta como dentro: un pilar pegado al muro es un montaje corriente, no un error. */
export function isObstacleInsidePolygon(
  obstacle: RoomObstacle,
  polygon: Polygon2d,
): boolean {
  if (polygon.length < 3) return false;

  if (obstacle.shape === "rect") {
    return rectObstacleOutline(obstacle).every(
      (corner) => pointInPolygon(corner, polygon) !== "outside",
    );
  }
  return (
    pointInPolygon(obstacle.at, polygon) === "inside" &&
    distancePointToPolygonM(obstacle.at, polygon) >=
      obstacle.size[0] - EPSILON_M
  );
}

export function doesObstacleOverlapPolygon(
  obstacle: RoomObstacle,
  polygon: Polygon2d,
): boolean {
  if (polygon.length < 3) return false;

  if (obstacle.shape === "rect") {
    return polygonsOverlap(rectObstacleOutline(obstacle), polygon);
  }
  return (
    pointInPolygon(obstacle.at, polygon) === "inside" ||
    distancePointToPolygonM(obstacle.at, polygon) < obstacle.size[0]
  );
}

export function doObstaclesOverlap(a: RoomObstacle, b: RoomObstacle): boolean {
  // Mismo centro es el caso real de "pegado dos veces": polygonsOverlap no lo ve porque dos
  // polígonos idénticos no tienen ningún vértice en el interior del otro ni ningún cruce propio.
  if (arePointsEqual(a.at, b.at)) return true;

  if (a.shape === "circle") {
    return b.shape === "circle"
      ? distanceM(a.at, b.at) < a.size[0] + b.size[0]
      : doesObstacleOverlapPolygon(a, rectObstacleOutline(b));
  }
  return b.shape === "rect"
    ? polygonsOverlap(rectObstacleOutline(a), rectObstacleOutline(b))
    : doesObstacleOverlapPolygon(b, rectObstacleOutline(a));
}
