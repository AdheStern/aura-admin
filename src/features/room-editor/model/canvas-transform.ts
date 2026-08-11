// src/features/room-editor/model/canvas-transform.ts — la frontera px↔m del editor (ver el
// invariante de geometry-2d.ts). Konva solo entiende píxeles de pantalla; esta es la única
// conversión permitida entre ese mundo y el modelo geométrico en metros.
//
// El paneo lo hace el propio <Stage x={originXPx} y={originYPx} draggable>, NO esta conversión: si
// aquí también se sumara el origen, quedaría contado dos veces (una por Konva moviendo el lienzo,
// otra por nosotros moviendo cada figura) y todo se desplazaría al doble de velocidad al arrastrar.
// Por eso toContentPointPx/toModelPointM son SOLO escala — los píxeles de "contenido" que manejan
// son relativos al origen que el Stage ya desplazó, y el punto del puntero que hay que convertir es
// el de `stage.getRelativePointerPosition()` (ya neto de ese desplazamiento), no
// `getPointerPosition()`. El zoom sí necesita el origen: `zoomAtPoint` recibe el puntero SIN
// relativizar porque tiene que calcular cuánto mover el Stage, no leer una posición ya movida.

import type { Point2d } from "@/features/room-editor/schemas/room-document";

/** originXPx/originYPx: posición x/y del <Stage> (paneo). scale: píxeles por metro (zoom). */
export type CanvasViewport = {
  originXPx: number;
  originYPx: number;
  scale: number;
};

export const DEFAULT_CANVAS_VIEWPORT: CanvasViewport = {
  originXPx: 80,
  originYPx: 80,
  scale: 40,
};

export const MIN_SCALE = 8;
export const MAX_SCALE = 200;

/** Metros → píxeles de contenido (relativos al Stage, que ya está desplazado por el paneo). */
export function toContentPointPx(
  pointM: Point2d,
  viewport: CanvasViewport,
): { x: number; y: number } {
  return { x: pointM[0] * viewport.scale, y: pointM[1] * viewport.scale };
}

/** Píxeles de contenido (de stage.getRelativePointerPosition()) → metros. */
export function toModelPointM(
  contentPointPx: { x: number; y: number },
  viewport: CanvasViewport,
): Point2d {
  return [contentPointPx.x / viewport.scale, contentPointPx.y / viewport.scale];
}

export function pxToM(lengthPx: number, viewport: CanvasViewport): number {
  return lengthPx / viewport.scale;
}

/**
 * Zoom centrado en el puntero: mueve el origen del Stage para que `absolutePointerPx` —de
 * stage.getPointerPosition(), SIN relativizar— caiga en el mismo punto del modelo antes y después
 * de cambiar la escala, que es lo que hace que la rueda del ratón "agarre" el punto bajo el cursor
 * en vez de hacer zoom hacia la esquina.
 */
export function zoomAtPoint(
  viewport: CanvasViewport,
  absolutePointerPx: { x: number; y: number },
  nextScale: number,
): CanvasViewport {
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
  const ratio = scale / viewport.scale;

  return {
    scale,
    originXPx:
      absolutePointerPx.x - (absolutePointerPx.x - viewport.originXPx) * ratio,
    originYPx:
      absolutePointerPx.y - (absolutePointerPx.y - viewport.originYPx) * ratio,
  };
}
