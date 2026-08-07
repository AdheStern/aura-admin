// src/features/room-editor/tools/measure-tool.ts — regla de medición. No toca el documento ni el
// historial: es lectura pura sobre el lienzo, así que no emite ningún RoomCommand. `active` en el
// draft distingue "siguiendo al puntero hacia el segundo punto" de "medición congelada" — un
// tercer clic no continúa la anterior, empieza una nueva desde ahí.

import type { RoomToolHandlers } from "@/features/room-editor/tools/tool-types";

export const measureTool: RoomToolHandlers = {
  label: "Medir",
  cursor: "crosshair",

  onPointerDown: (pointM, draft) => {
    if (draft.kind === "measure" && draft.active) {
      return {
        draft: {
          kind: "measure",
          startM: draft.startM,
          currentM: pointM,
          active: false,
        },
      };
    }
    return {
      draft: {
        kind: "measure",
        startM: pointM,
        currentM: pointM,
        active: true,
      },
    };
  },

  onPointerMove: (pointM, draft) =>
    draft.kind === "measure" && draft.active
      ? { draft: { ...draft, currentM: pointM } }
      : {},
};
