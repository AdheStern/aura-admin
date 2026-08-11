// src/features/room-3d/model/frame-camera.ts — punto de mira y radio de encuadre inicial de la
// cámara del editor 3D, a partir del footprint y la altura. Puro (sin three.js) para poder
// testear "la cámara mira al centro de la sala" sin levantar un contexto WebGL.

import { polygonCentroidM } from "@/features/room-editor/model/polygon-2d";
import type { Polygon2d } from "@/features/room-editor/schemas/room-document";

export type CameraFrame = {
  /** Centro de la sala en coordenadas three.js: (x, altura/2, y del documento). */
  targetM: readonly [number, number, number];
  /** Radio aproximado de la sala: fija distancia mínima/máxima de OrbitControls. */
  radiusM: number;
  /** Posición inicial de la cámara: 3/4 desde arriba, lo bastante lejos para que quepa la sala
   *  entera y no solo la esquina más cercana al target. */
  positionM: readonly [number, number, number];
};

/** Sala vacía (documento recién creado, sin footprint todavía): no hay de qué partir. */
const EMPTY_ROOM_RADIUS_M = 10;

/** Distancia de la cámara al target, en radios de sala: 1 dejaría la cámara justo sobre la
 *  esquina más lejana del footprint, demasiado cerca para ver la sala completa al abrir la vista. */
const INITIAL_DISTANCE_FACTOR = 1.8;

export function frameCamera(vertices: Polygon2d, heightM: number): CameraFrame {
  if (vertices.length === 0) {
    const targetM: readonly [number, number, number] = [0, heightM / 2, 0];
    return {
      targetM,
      radiusM: EMPTY_ROOM_RADIUS_M,
      positionM: offsetPosition(targetM, EMPTY_ROOM_RADIUS_M),
    };
  }

  const [cx, cz] = polygonCentroidM(vertices);
  const radiusM = Math.max(
    ...vertices.map(([x, y]) => Math.hypot(x - cx, y - cz)),
    heightM / 2,
  );
  const targetM: readonly [number, number, number] = [cx, heightM / 2, cz];

  return { targetM, radiusM, positionM: offsetPosition(targetM, radiusM) };
}

function offsetPosition(
  targetM: readonly [number, number, number],
  radiusM: number,
): readonly [number, number, number] {
  const distanceM = radiusM * INITIAL_DISTANCE_FACTOR;
  return [
    targetM[0] + distanceM,
    targetM[1] + distanceM * 0.6,
    targetM[2] + distanceM,
  ];
}
