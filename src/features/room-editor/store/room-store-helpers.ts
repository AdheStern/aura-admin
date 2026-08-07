// src/features/room-editor/store/room-store-helpers.ts — funciones puras que comparte
// createRoomStore: revalida contra el dominio (Tarea 1) y construye el RoomCommand que corresponde
// a "mover/editar/borrar la zona X", que es el único punto realmente no trivial porque una zona
// puede ser el escenario (setStage) o una de audiencia (replaceAudienceZone/removeAudienceZone) y
// el comando correcto depende de cuál de las dos es — ver findZone en room-selection.ts.

import type { RoomCommand } from "@/features/room-editor/schemas/room-command";
import type {
  Point2d,
  Polygon2d,
  RoomDocument,
  RoomObstacle,
  RoomOpening,
} from "@/features/room-editor/schemas/room-document";
import { findZone } from "@/features/room-editor/store/room-selection";
import type { RoomStoreState } from "@/features/room-editor/store/room-store-types";
import { validateRoom } from "@/features/room-editor/validation/validate-room";

export function revalidate(
  set: (partial: Partial<RoomStoreState>) => void,
  get: () => RoomStoreState,
): void {
  const state = get();
  set({
    validation: validateRoom(state.document, {
      materialIds: state.materialIds,
    }),
  });
}

export function patchedObstacle(
  document: RoomDocument,
  id: string,
  patch: Partial<Pick<RoomObstacle, "at" | "size" | "materialId">>,
): RoomObstacle | null {
  const previous = document.obstacles.find((obstacle) => obstacle.id === id);
  if (!previous) return null;
  return { ...previous, ...patch } as RoomObstacle;
}

export function patchedOpening(
  document: RoomDocument,
  id: string,
  patch: Partial<Pick<RoomOpening, "rect" | "materialId">>,
): RoomOpening | null {
  const previous = document.openings.find((opening) => opening.id === id);
  return previous ? { ...previous, ...patch } : null;
}

function translatedPolygon(polygon: Polygon2d, deltaM: Point2d): Polygon2d {
  return polygon.map(([x, y]) => [x + deltaM[0], y + deltaM[1]]);
}

export function buildZoneMoveCommand(
  document: RoomDocument,
  id: string,
  deltaM: Point2d,
): RoomCommand | null {
  const resolved = findZone(document, id);
  if (!resolved) return null;

  const polygon = translatedPolygon(resolved.zone.polygon, deltaM);
  return resolved.origin === "stage"
    ? { kind: "setStage", stage: { ...resolved.zone, polygon } }
    : { kind: "replaceAudienceZone", zone: { ...resolved.zone, polygon } };
}

/** earHeightOrElevation lee earHeight en audiencia y elevation en escenario: son la misma cota
 *  vertical de la figura, con nombre distinto porque el contrato las declara en objetos distintos. */
export function buildZoneAttributesCommand(
  document: RoomDocument,
  id: string,
  patch: { earHeightOrElevation: number; seated?: boolean },
): RoomCommand | null {
  const resolved = findZone(document, id);
  if (!resolved) return null;

  return resolved.origin === "stage"
    ? {
        kind: "setStage",
        stage: { ...resolved.zone, elevation: patch.earHeightOrElevation },
      }
    : {
        kind: "replaceAudienceZone",
        zone: {
          ...resolved.zone,
          earHeight: patch.earHeightOrElevation,
          seated: patch.seated ?? resolved.zone.seated,
        },
      };
}

export function buildZoneRemoveCommand(
  document: RoomDocument,
  id: string,
): RoomCommand | null {
  const resolved = findZone(document, id);
  if (!resolved) return null;

  return resolved.origin === "stage"
    ? { kind: "setStage", stage: null }
    : { kind: "removeAudienceZone", id };
}
