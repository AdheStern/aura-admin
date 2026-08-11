// src/features/room-editor/model/polygon-2d.ts — la forma de un polígono en planta (metros):
// aristas, área, orientación y si es simple. Las relaciones entre dos figuras viven en
// polygon-topology.ts.
//
// El cierre siempre es implícito: la última arista une el último vértice con el primero, igual que
// en el contrato RoomGeometry. Ningún consumidor debe repetir el primer vértice al final.

import {
  arePointsEqual,
  distanceM,
  orientation,
  segmentsIntersect,
} from "@/features/room-editor/model/geometry-2d";
import type {
  Point2d,
  Polygon2d,
} from "@/features/room-editor/schemas/room-document";

/** Por debajo de esto no hay polígono que cerrar. Lo comparten el validador
 *  (FOOTPRINT_TOO_FEW_VERTICES) y los guardias del editor que se adelantan a él: si divergen, una
 *  de las dos mitades deja pasar plantas que la otra rechaza. */
export const MIN_FOOTPRINT_VERTICES = 3;

export type PolygonEdge = { index: number; from: Point2d; to: Point2d };

export function polygonEdges(polygon: Polygon2d): PolygonEdge[] {
  return polygon.map((from, index) => ({
    index,
    from,
    to: polygon[(index + 1) % polygon.length],
  }));
}

export function edgeLengthM(polygon: Polygon2d, index: number): number {
  const edge = polygonEdges(polygon)[index];
  return edge ? distanceM(edge.from, edge.to) : 0;
}

/** Fórmula del cordón de zapato. Positiva si el polígono está en sentido antihorario (CCW). */
export function signedAreaM2(polygon: Polygon2d): number {
  return (
    polygonEdges(polygon).reduce(
      (sum, { from, to }) => sum + (from[0] * to[1] - to[0] * from[1]),
      0,
    ) / 2
  );
}

export function polygonAreaM2(polygon: Polygon2d): number {
  return Math.abs(signedAreaM2(polygon));
}

/** El contrato exige vértices CCW; esta es la comprobación que lo respalda. */
export function isCcw(polygon: Polygon2d): boolean {
  return signedAreaM2(polygon) > 0;
}

export function reversePolygon(polygon: Polygon2d): Polygon2d {
  return [...polygon].reverse();
}

export function polygonCentroidM(polygon: Polygon2d): Point2d {
  const sum = polygon.reduce<Point2d>(
    (acc, [x, y]) => [acc[0] + x, acc[1] + y],
    [0, 0],
  );
  return [sum[0] / polygon.length, sum[1] / polygon.length];
}

/**
 * La normal unitaria de `edge` que apunta hacia el interior de `polygon` — decide, por ejemplo,
 * hacia qué lado abre el símbolo de una puerta (opening-symbols.tsx). Se resuelve contra el
 * centroide en vez de fiarse del sentido de giro de `polygon`: más robusto que asumir CCW, que es
 * una invariante que un documento a medio dibujar todavía puede no cumplir.
 */
export function inwardNormalM(
  edge: { from: Point2d; to: Point2d },
  polygon: Polygon2d,
): [number, number] {
  const dx = edge.to[0] - edge.from[0];
  const dy = edge.to[1] - edge.from[1];
  const lengthM = Math.hypot(dx, dy) || 1;
  // `|| 0` en vez de dejar pasar el resultado tal cual: un lado horizontal o vertical produce un
  // -0 que sigue siendo matemáticamente 0 pero que rompe una comparación por igualdad estructural
  // ([-0, 1] no es [0, 1] para toEqual) en cualquier código que compare esta normal contra otra.
  const candidate: [number, number] = [-dy / lengthM || 0, dx / lengthM || 0];

  const centroid = polygonCentroidM(polygon);
  const midpoint: Point2d = [
    (edge.from[0] + edge.to[0]) / 2,
    (edge.from[1] + edge.to[1]) / 2,
  ];
  const towardCentroid: [number, number] = [
    centroid[0] - midpoint[0],
    centroid[1] - midpoint[1],
  ];
  const dot =
    candidate[0] * towardCentroid[0] + candidate[1] * towardCentroid[1];
  return dot >= 0 ? candidate : [-candidate[0] || 0, -candidate[1] || 0];
}

/** Aristas de longitud despreciable: dos clicks en el mismo punto de la rejilla. */
export function degenerateEdgeIndexes(
  polygon: Polygon2d,
  minLengthM: number,
): number[] {
  return polygonEdges(polygon)
    .filter(({ from, to }) => distanceM(from, to) < minLengthM)
    .map(({ index }) => index);
}

/**
 * Polígono simple: sin auto-intersecciones (§5.2 lo exige antes de pasar a 3D).
 *
 * Dos comprobaciones, no una: las aristas NO adyacentes no pueden tocarse ni de refilón, y las
 * adyacentes solo pueden compartir su vértice común — si además son colineales y vuelven sobre sí
 * mismas (una púa de ángulo cero) se solapan, que es auto-intersección aunque el test de cruce de
 * segmentos no la vea.
 */
export function isSimplePolygon(polygon: Polygon2d): boolean {
  if (polygon.length < 3) return false;

  const edges = polygonEdges(polygon);
  for (const a of edges) {
    for (const b of edges) {
      if (b.index <= a.index) continue;
      if (areEdgesAdjacent(a.index, b.index, edges.length)) continue;
      if (segmentsIntersect(a.from, a.to, b.from, b.to)) return false;
    }
  }
  return !hasSpike(polygon);
}

function areEdgesAdjacent(a: number, b: number, count: number): boolean {
  return (a + 1) % count === b || (b + 1) % count === a;
}

function hasSpike(polygon: Polygon2d): boolean {
  return polygon.some((vertex, index) => {
    const previous = polygon[(index + polygon.length - 1) % polygon.length];
    const next = polygon[(index + 1) % polygon.length];
    if (arePointsEqual(previous, next)) return true;
    if (orientation(previous, vertex, next) !== 0) return false;

    // Colineales: es púa solo si previous y next salen del vértice hacia el MISMO lado.
    const toPrevious = [previous[0] - vertex[0], previous[1] - vertex[1]];
    const toNext = [next[0] - vertex[0], next[1] - vertex[1]];
    return toPrevious[0] * toNext[0] + toPrevious[1] * toNext[1] > 0;
  });
}
