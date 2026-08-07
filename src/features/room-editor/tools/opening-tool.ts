// src/features/room-editor/tools/opening-tool.ts — ventana o puerta sobre el muro más cercano al
// clic. Si no hay ningún muro a menos de OPENING_SNAP_M, el clic no hace nada — no tiene sentido
// una abertura sin `surfaceId`, y OPENING_SURFACE_MISSING existe para el caso en que el muro
// desaparezca DESPUÉS, no para que el editor lo permita al crearla.

import { nearestWallHit } from "@/features/room-editor/model/wall-hit-test";
import type { RoomOpening } from "@/features/room-editor/schemas/room-document";
import type { RoomToolHandlers } from "@/features/room-editor/tools/tool-types";

const OPENING_SNAP_M = 0.5;

type OpeningDefaults = {
  widthM: number;
  heightM: number;
  /** Altura del antepecho: 0 en una puerta (llega al piso), > 0 en una ventana. */
  sillM: number;
};

const DEFAULTS: Record<"window" | "door", OpeningDefaults> = {
  window: { widthM: 1.5, heightM: 1.5, sillM: 1.0 },
  door: { widthM: 0.9, heightM: 2.1, sillM: 0 },
};

export function createOpeningTool(type: "window" | "door"): RoomToolHandlers {
  const defaults = DEFAULTS[type];

  return {
    label: type === "window" ? "Ventana" : "Puerta",
    cursor: "copy",

    onPointerDown: (pointM, _draft, document) => {
      const hit = nearestWallHit(document, pointM, OPENING_SNAP_M);
      if (!hit) return {};

      // Centra la abertura en el punto clicado, recortando a lo que el muro realmente mide: un
      // muro más corto que el ancho por defecto se lleva una abertura tan ancha como él.
      const widthM = Math.min(defaults.widthM, hit.lengthM);
      const xM = Math.min(
        Math.max(0, hit.localXM - widthM / 2),
        hit.lengthM - widthM,
      );

      const opening: RoomOpening = {
        id: crypto.randomUUID(),
        type,
        surfaceId: hit.surfaceId,
        rect: [xM, defaults.sillM, widthM, defaults.heightM],
        materialId: null,
      };

      return {
        command: {
          kind: "insertOpening",
          index: document.openings.length,
          opening,
        },
        select: { kind: "opening", id: opening.id },
      };
    },
  };
}
