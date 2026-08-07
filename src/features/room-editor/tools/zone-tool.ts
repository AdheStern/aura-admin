// src/features/room-editor/tools/zone-tool.ts — zona de escenario o de audiencia, de esquina a
// esquina. El contrato admite polígonos arbitrarios (RoomZone.polygon no está limitado a rectas),
// pero la herramienta v1 solo ofrece rectángulos — igual que rect-tool.ts con el footprint, es KISS
// deliberado: la forma libre no aporta sobre el rectángulo para la mayoría de escenarios reales, y
// quien de verdad necesite una zona irregular puede aproximarla con dos zonas de audiencia.

import { rectCorners } from "@/features/room-editor/tools/rect-geometry";
import type { RoomToolHandlers } from "@/features/room-editor/tools/tool-types";

const MIN_SIDE_M = 0.3;
const DEFAULT_EAR_HEIGHT_M = 1.2;
const DEFAULT_STAGE_ELEVATION_M = 0.8;

export function createZoneTool(kind: "stage" | "audience"): RoomToolHandlers {
  return {
    label: kind === "stage" ? "Zona de escenario" : "Zona de audiencia",
    cursor: "crosshair",

    onPointerDown: (pointM) => ({
      draft: { kind: "drag", startM: pointM, currentM: pointM },
    }),

    onPointerMove: (pointM, draft) =>
      draft.kind === "drag" ? { draft: { ...draft, currentM: pointM } } : {},

    onPointerUp: (pointM, draft, document) => {
      if (draft.kind !== "drag") return {};

      const polygon = rectCorners(draft.startM, pointM, MIN_SIDE_M);
      if (!polygon) return { draft: { kind: "idle" } };

      const id = crypto.randomUUID();
      if (kind === "stage") {
        return {
          draft: { kind: "idle" },
          command: {
            kind: "setStage",
            stage: { id, polygon, elevation: DEFAULT_STAGE_ELEVATION_M },
          },
          select: { kind: "zone", id },
        };
      }
      return {
        draft: { kind: "idle" },
        command: {
          kind: "insertAudienceZone",
          index: document.zones.audience.length,
          zone: { id, polygon, earHeight: DEFAULT_EAR_HEIGHT_M, seated: true },
        },
        select: { kind: "zone", id },
      };
    },
  };
}
