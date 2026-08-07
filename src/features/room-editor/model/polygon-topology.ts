// src/features/room-editor/model/polygon-topology.ts — relaciones espaciales entre figuras:
// dentro, fuera, encima. Separado de polygon-2d.ts, que responde por la forma de UN polígono
// (área, orientación, si es simple); aquí siempre hay dos cosas puestas en relación.

import {
  distancePointToSegmentM,
  isPointOnSegment,
  midpointM,
  orientation,
  segmentsProperlyCross,
} from "@/features/room-editor/model/geometry-2d";
import { polygonEdges } from "@/features/room-editor/model/polygon-2d";
import type {
  Point2d,
  Polygon2d,
} from "@/features/room-editor/schemas/room-document";

export type PointLocation = "inside" | "boundary" | "outside";

export function pointInPolygon(
  point: Point2d,
  polygon: Polygon2d,
): PointLocation {
  if (polygon.length < 3) return "outside";

  for (const { from, to } of polygonEdges(polygon)) {
    if (
      orientation(from, to, point) === 0 &&
      isPointOnSegment(point, from, to)
    ) {
      return "boundary";
    }
  }

  // Lanzamiento de rayo horizontal. La condición asimétrica (from[1] > y) !== (to[1] > y) es la
  // que evita contar dos veces un vértice que el rayo atraviesa justo por su altura.
  let isInside = false;
  for (const { from, to } of polygonEdges(polygon)) {
    const crosses = from[1] > point[1] !== to[1] > point[1];
    if (!crosses) continue;
    const xAtY =
      from[0] + ((point[1] - from[1]) * (to[0] - from[0])) / (to[1] - from[1]);
    if (point[0] < xAtY) isInside = !isInside;
  }
  return isInside ? "inside" : "outside";
}

/**
 * Contención tolerante con el borde: una zona de audiencia que cubre la sala entera está dentro.
 *
 * Los puntos medios de las aristas no son redundantes: con un footprint cóncavo un polígono con
 * todos sus vértices apoyados en el borde puede cruzar la muesca por fuera sin que ninguna arista
 * llegue a cortar el contorno.
 */
export function isPolygonInsidePolygon(
  inner: Polygon2d,
  outer: Polygon2d,
): boolean {
  if (inner.length < 3 || outer.length < 3) return false;

  const probes = [
    ...inner,
    ...polygonEdges(inner).map(({ from, to }) => midpointM(from, to)),
  ];
  if (probes.some((probe) => pointInPolygon(probe, outer) === "outside")) {
    return false;
  }

  return !polygonEdges(inner).some((innerEdge) =>
    polygonEdges(outer).some((outerEdge) =>
      segmentsProperlyCross(
        innerEdge.from,
        innerEdge.to,
        outerEdge.from,
        outerEdge.to,
      ),
    ),
  );
}

/** Solape con área. Compartir un borde no cuenta: dos zonas contiguas no se pisan. */
export function polygonsOverlap(a: Polygon2d, b: Polygon2d): boolean {
  if (a.length < 3 || b.length < 3) return false;

  if (a.some((point) => pointInPolygon(point, b) === "inside")) return true;
  if (b.some((point) => pointInPolygon(point, a) === "inside")) return true;

  return polygonEdges(a).some((edgeA) =>
    polygonEdges(b).some((edgeB) =>
      segmentsProperlyCross(edgeA.from, edgeA.to, edgeB.from, edgeB.to),
    ),
  );
}

export function distancePointToPolygonM(
  point: Point2d,
  polygon: Polygon2d,
): number {
  return Math.min(
    ...polygonEdges(polygon).map(({ from, to }) =>
      distancePointToSegmentM(point, from, to),
    ),
  );
}
