// src/features/room-editor/validation/room-index.ts — lo que todos los checks necesitan, calculado
// una vez. El campo que de verdad importa es `isFootprintUsable`: mientras la planta no sea un
// polígono simple, "la zona se sale del recinto" o "la abertura no cabe en el muro" no son
// problemas del usuario sino ruido derivado del primero, y los checks que dependen de ella callan.

import { isSimplePolygon } from "@/features/room-editor/model/polygon-2d";
import {
  type RoomShell,
  shellOf,
  wallSurfaces,
} from "@/features/room-editor/model/wall-surfaces";
import type {
  Polygon2d,
  RoomDocument,
  RoomSurface,
} from "@/features/room-editor/schemas/room-document";

/** Los materiales que existen hoy en el catálogo. Se pasa como argumento, nunca se consulta BD. */
export type RoomCatalog = {
  materialIds: ReadonlySet<string>;
};

export type RoomIndex = {
  document: RoomDocument;
  catalog: RoomCatalog;
  footprint: Polygon2d;
  isFootprintUsable: boolean;
  walls: RoomSurface[];
  shell: RoomShell;
};

export function buildRoomIndex(
  document: RoomDocument,
  catalog: RoomCatalog,
): RoomIndex {
  const footprint = document.footprint.vertices;

  return {
    document,
    catalog,
    footprint,
    isFootprintUsable: isSimplePolygon(footprint),
    walls: wallSurfaces(document.surfaces),
    shell: shellOf(document),
  };
}
