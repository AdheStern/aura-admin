// src/features/room-editor/tools/rect-tool.ts — planta rectangular de esquina a esquina. El atajo
// para la sala más común (§5.2 la lista aparte de la polilínea): un solo arrastre reemplaza el
// footprint entero, sin tener que clicar cuatro veces.

import { rectCorners } from "@/features/room-editor/tools/rect-geometry";
import type { RoomToolHandlers } from "@/features/room-editor/tools/tool-types";

const MIN_SIDE_M = 0.3;

export const rectTool: RoomToolHandlers = {
  label: "Rectángulo",
  cursor: "crosshair",

  onPointerDown: (pointM) => ({
    draft: { kind: "drag", startM: pointM, currentM: pointM },
  }),

  onPointerMove: (pointM, draft) =>
    draft.kind === "drag" ? { draft: { ...draft, currentM: pointM } } : {},

  onPointerUp: (pointM, draft) => {
    if (draft.kind !== "drag") return {};

    const corners = rectCorners(draft.startM, pointM, MIN_SIDE_M);
    return corners
      ? {
          draft: { kind: "idle" },
          command: { kind: "setFootprint", vertices: corners },
        }
      : { draft: { kind: "idle" } };
  },
};
