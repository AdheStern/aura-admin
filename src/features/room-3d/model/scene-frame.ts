// src/features/room-3d/model/scene-frame.ts — la frontera entre los dos marcos de referencia.
//
// El contrato (RoomGeometry, SimulationRequest) es Z-UP: la planta va en [x, y] y z es la altura.
// three.js es Y-UP, y pelearlo saldría caro — la cámara, las luces y OrbitControls asumen que
// "arriba" es +y. Así que el documento se guarda siempre en el marco del contrato y la conversión
// ocurre solo aquí, igual que el editor 2D convierte px↔m en un único sitio.

import type { Point2d } from "@/features/room-editor/schemas/room-document";

/** Punto en el marco de three.js: [x, altura, profundidad]. */
export type ScenePoint = readonly [number, number, number];

/** Un punto de la planta a la altura dada. */
export function toScenePlanPoint([x, y]: Point2d, heightM: number): ScenePoint {
  return [x, heightM, y];
}

/** Un punto del contrato [x, y, z] con z = altura. */
export function toScenePoint([x, y, z]: readonly [
  number,
  number,
  number,
]): ScenePoint {
  return [x, z, y];
}

/** La vuelta: lo que el gizmo reporta en la escena, de vuelta al marco que se persiste. */
export function toContractPosition([x, height, y]: ScenePoint): [
  number,
  number,
  number,
] {
  return [x, y, height];
}
