// src/features/room-editor/model/geometry-2d.ts — primitivas de punto y segmento en planta.
//
// INVARIANTE DEL EDITOR: aquí y en todo el modelo geométrico las coordenadas son METROS. Konva
// reporta píxeles de pantalla y la conversión ocurre SOLO en la capa de herramientas; si aparece un
// px por debajo de este módulo, es un bug.
//
// Los predicados usan dos épsilon distintos porque tienen unidades distintas: EPSILON_M compara
// longitudes y EPSILON_M2 el producto cruzado, que es un área. Compartir uno solo haría que la
// colinealidad fuese absurdamente tolerante o absurdamente estricta según la escala de la sala.

import type { Point2d } from "@/features/room-editor/schemas/room-document";

/** Rejilla del editor (§5.2 del doc maestro). */
export const SNAP_M = 0.1;

export const EPSILON_M = 1e-6;

const EPSILON_M2 = 1e-9;
const DECIMALS_M = 3;

/** Redondea al milímetro además de a la rejilla: sumar pasos de 0.1 acumula 0.30000000000000004. */
export function snapToGridM(valueM: number): number {
  return Number((Math.round(valueM / SNAP_M) * SNAP_M).toFixed(DECIMALS_M));
}

export function snapPointToGridM(point: Point2d): Point2d {
  return [snapToGridM(point[0]), snapToGridM(point[1])];
}

export function distanceM(a: Point2d, b: Point2d): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/** Tolerancia angular del snap ortogonal usado al dibujar un muro por polilínea (§5.2). El snap a
 *  la rejilla por sí solo no basta para que un muro salga recto: cada vértice se redondea de forma
 *  independiente, así que una mano casi-horizontal puede caer un paso de rejilla más abajo en un
 *  extremo que en el otro. Forzar la coordenada perpendicular a igualar la del vértice anterior,
 *  dentro de esta tolerancia, es lo que de verdad garantiza el ángulo recto. */
const ORTHO_SNAP_DEG = 6;

/** Si fromM→toM cae dentro de ORTHO_SNAP_DEG de la horizontal o la vertical, fuerza esa coordenada
 *  a igualar la de `fromM`; fuera de esa franja el punto pasa sin tocar (una diagonal deliberada
 *  sigue siendo posible). */
export function snapOrthoM(fromM: Point2d, toM: Point2d): Point2d {
  const dx = toM[0] - fromM[0];
  const dy = toM[1] - fromM[1];
  if (dx === 0 && dy === 0) return toM;

  const angleDeg = (Math.atan2(Math.abs(dy), Math.abs(dx)) * 180) / Math.PI;
  if (angleDeg <= ORTHO_SNAP_DEG) return [toM[0], fromM[1]];
  if (angleDeg >= 90 - ORTHO_SNAP_DEG) return [fromM[0], toM[1]];
  return toM;
}

export function arePointsEqual(a: Point2d, b: Point2d): boolean {
  return distanceM(a, b) <= EPSILON_M;
}

/** 1 = c queda a la izquierda de a→b (giro antihorario), -1 a la derecha, 0 colineal. */
export function orientation(a: Point2d, b: Point2d, c: Point2d): -1 | 0 | 1 {
  const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  if (cross > EPSILON_M2) return 1;
  if (cross < -EPSILON_M2) return -1;
  return 0;
}

/** Solo tiene sentido con p ya colineal con a→b: comprueba que caiga dentro del tramo. */
export function isPointOnSegment(p: Point2d, a: Point2d, b: Point2d): boolean {
  return (
    p[0] >= Math.min(a[0], b[0]) - EPSILON_M &&
    p[0] <= Math.max(a[0], b[0]) + EPSILON_M &&
    p[1] >= Math.min(a[1], b[1]) - EPSILON_M &&
    p[1] <= Math.max(a[1], b[1]) + EPSILON_M
  );
}

/** Inclusivo: tocarse por un extremo o solaparse colineales cuenta como intersección. */
export function segmentsIntersect(
  a1: Point2d,
  a2: Point2d,
  b1: Point2d,
  b2: Point2d,
): boolean {
  const o1 = orientation(a1, a2, b1);
  const o2 = orientation(a1, a2, b2);
  const o3 = orientation(b1, b2, a1);
  const o4 = orientation(b1, b2, a2);

  if (o1 !== o2 && o3 !== o4) return true;

  if (o1 === 0 && isPointOnSegment(b1, a1, a2)) return true;
  if (o2 === 0 && isPointOnSegment(b2, a1, a2)) return true;
  if (o3 === 0 && isPointOnSegment(a1, b1, b2)) return true;
  return o4 === 0 && isPointOnSegment(a2, b1, b2);
}

/**
 * Cruce estricto: los dos segmentos se atraviesan por su interior.
 *
 * Es el predicado que necesita la contención de polígonos, no el inclusivo: una zona de audiencia
 * que ocupa la sala entera comparte sus cuatro aristas con el footprint, y con el inclusivo cada
 * arista compartida se leería como "la zona sale del recinto".
 */
export function segmentsProperlyCross(
  a1: Point2d,
  a2: Point2d,
  b1: Point2d,
  b2: Point2d,
): boolean {
  const o1 = orientation(a1, a2, b1);
  const o2 = orientation(a1, a2, b2);
  const o3 = orientation(b1, b2, a1);
  const o4 = orientation(b1, b2, a2);

  return o1 !== 0 && o2 !== 0 && o3 !== 0 && o4 !== 0 && o1 !== o2 && o3 !== o4;
}

export type SegmentProjection = {
  /** Punto de a→b más cercano a p. */
  pointM: Point2d;
  /** Distancia de p a ese punto. */
  distanceM: number;
  /** Distancia a lo largo de a→b hasta el punto, ya recortada a [0, |a→b|]. */
  alongM: number;
};

/** El resto de proyecciones puntuales (distancia, aberturas sobre un muro) se apoyan en esta. */
export function projectPointOnSegmentM(
  p: Point2d,
  a: Point2d,
  b: Point2d,
): SegmentProjection {
  const lengthSquared = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
  if (lengthSquared <= EPSILON_M2) {
    return { pointM: a, distanceM: distanceM(p, a), alongM: 0 };
  }

  const t =
    ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) /
    lengthSquared;
  const clamped = Math.min(1, Math.max(0, t));
  const pointM: Point2d = [
    a[0] + clamped * (b[0] - a[0]),
    a[1] + clamped * (b[1] - a[1]),
  ];
  return {
    pointM,
    distanceM: distanceM(p, pointM),
    alongM: clamped * Math.sqrt(lengthSquared),
  };
}

export function distancePointToSegmentM(
  p: Point2d,
  a: Point2d,
  b: Point2d,
): number {
  return projectPointOnSegmentM(p, a, b).distanceM;
}

export function midpointM(a: Point2d, b: Point2d): Point2d {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
