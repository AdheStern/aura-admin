// src/features/room-editor/tools/pillar-tool.ts — coloca un pilar de un clic, tamaño por defecto.
// Redimensionar es trabajo del modo seleccionar (arrastra las manijas en obstacle-layer.tsx) — este
// archivo solo resuelve DÓNDE, nunca CUÁNTO mide.

import type { RoomObstacle } from "@/features/room-editor/schemas/room-document";
import type { RoomToolHandlers } from "@/features/room-editor/tools/tool-types";

const DEFAULT_RECT_SIZE_M: [number, number] = [0.6, 0.6];
const DEFAULT_CIRCLE_RADIUS_M = 0.3;

export function createPillarTool(shape: "rect" | "circle"): RoomToolHandlers {
  return {
    label: shape === "rect" ? "Pilar rectangular" : "Pilar circular",
    cursor: "copy",

    onPointerDown: (pointM, _draft, document) => {
      const obstacle: RoomObstacle =
        shape === "rect"
          ? {
              id: crypto.randomUUID(),
              type: "pillar",
              shape: "rect",
              at: pointM,
              size: DEFAULT_RECT_SIZE_M,
              materialId: null,
            }
          : {
              id: crypto.randomUUID(),
              type: "pillar",
              shape: "circle",
              at: pointM,
              size: [DEFAULT_CIRCLE_RADIUS_M],
              materialId: null,
            };

      return {
        command: {
          kind: "insertObstacle",
          index: document.obstacles.length,
          obstacle,
        },
        select: { kind: "obstacle", id: obstacle.id },
      };
    },
  };
}
