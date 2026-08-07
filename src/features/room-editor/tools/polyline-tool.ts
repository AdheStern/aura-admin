// src/features/room-editor/tools/polyline-tool.ts — muro por polilínea: dibuja el footprint y lo
// cierra clicando cerca del primer punto (o con Enter, que cierra con los puntos tal cual sin exigir
// volver). Emite un solo `setFootprint` al cerrar — mientras tanto solo acumula puntos en el draft,
// sin tocar el historial: un clic que no cierra nada no es una acción deshacible.
//
// Cada segmento nuevo pasa por snapOrthoM contra el último vértice YA committeado — no contra el
// primer punto ni ningún otro: es el mismo criterio con el que un CAD real ofrece "ortho" mientras
// se dibuja, y evita que cerrar el lazo cerca del primer punto se enganche a un eje que no viene a
// cuento. Si `pointM` ya llegó enganchado a un punto existente (room-canvas.tsx le da prioridad
// sobre la rejilla — ver snap-points.ts), el ortho-snap se salta: forzar el ángulo encima ahora
// alejaría el vértice del punto exacto al que el usuario apuntaba.

import {
  distanceM,
  snapOrthoM,
} from "@/features/room-editor/model/geometry-2d";
import { nearestExistingPointM } from "@/features/room-editor/model/snap-points";
import type {
  Point2d,
  RoomDocument,
} from "@/features/room-editor/schemas/room-document";
import type { RoomToolHandlers } from "@/features/room-editor/tools/tool-types";

// Bastante mayor que el paso de la rejilla (0.1 m): cerrar el lazo es un gesto deliberado del
// usuario, no algo que deba fallar por un pixel de puntería a una escala de zoom alejada.
const CLOSE_DISTANCE_M = 0.3;
const MIN_VERTICES = 3;

export const polylineTool: RoomToolHandlers = {
  label: "Muro (polilínea)",
  cursor: "crosshair",

  onPointerDown: (pointM, draft, document) => {
    const points = draft.kind === "wall" ? draft.pointsM : [];

    if (points.length >= MIN_VERTICES - 1) {
      const closesLoop = distanceM(pointM, points[0]) <= CLOSE_DISTANCE_M;
      if (closesLoop) {
        return {
          draft: { kind: "idle" },
          command: { kind: "setFootprint", vertices: points },
        };
      }
    }
    const last = points[points.length - 1];
    const nextPoint = last
      ? orthoSnapUnlessExisting(last, pointM, document)
      : pointM;
    return { draft: { kind: "wall", pointsM: [...points, nextPoint] } };
  },

  onPointerMove: (pointM, draft, document) => {
    if (draft.kind !== "wall") return {};
    const last = draft.pointsM[draft.pointsM.length - 1];
    const cursorM = last
      ? orthoSnapUnlessExisting(last, pointM, document)
      : pointM;
    return { draft: { ...draft, cursorM } };
  },

  onEnter: (draft) => {
    if (draft.kind !== "wall" || draft.pointsM.length < MIN_VERTICES) return {};
    return {
      draft: { kind: "idle" },
      command: { kind: "setFootprint", vertices: draft.pointsM },
    };
  },
};

function orthoSnapUnlessExisting(
  lastM: Point2d,
  pointM: Point2d,
  document: RoomDocument,
): Point2d {
  const isAlreadyOnExistingPoint =
    nearestExistingPointM(pointM, document) !== null;
  return isAlreadyOnExistingPoint ? pointM : snapOrthoM(lastM, pointM);
}
