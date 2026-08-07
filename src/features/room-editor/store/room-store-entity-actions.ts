// src/features/room-editor/store/room-store-entity-actions.ts — el slice de edición puntual: mover
// un vértice, cambiar el material de un muro, editar o borrar un pilar/abertura/zona. Separado de
// room-store.ts (patrón "slices combinados" de §9.3: un store Zustand se divide cuando pasa de
// ~150 líneas) porque es la mitad más mecánica del store — cada acción construye UN RoomCommand y
// lo pasa a runCommand, que ya vive en el otro slice.

import { MIN_FOOTPRINT_VERTICES } from "@/features/room-editor/model/polygon-2d";
import {
  buildZoneAttributesCommand,
  buildZoneMoveCommand,
  buildZoneRemoveCommand,
  patchedObstacle,
  patchedOpening,
} from "@/features/room-editor/store/room-store-helpers";
import type {
  RoomStoreGet,
  RoomStoreSet,
  RoomStoreState,
} from "@/features/room-editor/store/room-store-types";

type EntityActions = Pick<
  RoomStoreState,
  | "moveVertexTo"
  | "removeVertexAt"
  | "insertVertexAt"
  | "setHeightM"
  | "setSurfaceMaterial"
  | "updateObstacle"
  | "removeObstacle"
  | "updateOpening"
  | "removeOpening"
  | "moveZoneTo"
  | "updateZoneAttributes"
  | "removeZone"
  | "deleteSelection"
>;

export function createEntityActions(
  set: RoomStoreSet,
  get: RoomStoreGet,
): EntityActions {
  function clearSelectionOf(kind: string, id: string): void {
    const selection = get().selection;
    if (
      selection &&
      "id" in selection &&
      selection.kind === kind &&
      selection.id === id
    ) {
      set({ selection: null });
    }
  }

  return {
    moveVertexTo: (index, pointM) =>
      get().runCommand({ kind: "moveVertex", index, atM: pointM }),
    // El mínimo se guarda AQUÍ y no en cada botón: al vértice se le puede llegar por el panel, por
    // la goma de borrar y por la tecla Supr, y dejar que una planta triangular baje a 2 vértices
    // solo para que el validador la rechace después es justo lo que el `disabled` del panel evita.
    removeVertexAt: (index) => {
      if (get().document.footprint.vertices.length <= MIN_FOOTPRINT_VERTICES) {
        return;
      }
      get().runCommand({ kind: "removeVertex", index });
      set({ selection: null });
    },
    insertVertexAt: (edgeIndex, pointM) =>
      get().runCommand({ kind: "insertVertex", index: edgeIndex, atM: pointM }),
    setHeightM: (heightM) => get().runCommand({ kind: "setHeight", heightM }),
    setSurfaceMaterial: (surfaceId, materialId) =>
      get().runCommand({ kind: "setSurfaceMaterial", surfaceId, materialId }),

    updateObstacle: (id, patch) => {
      const obstacle = patchedObstacle(get().document, id, patch);
      if (obstacle) get().runCommand({ kind: "replaceObstacle", obstacle });
    },
    removeObstacle: (id) => {
      get().runCommand({ kind: "removeObstacle", id });
      clearSelectionOf("obstacle", id);
    },

    updateOpening: (id, patch) => {
      const opening = patchedOpening(get().document, id, patch);
      if (opening) get().runCommand({ kind: "replaceOpening", opening });
    },
    removeOpening: (id) => {
      get().runCommand({ kind: "removeOpening", id });
      clearSelectionOf("opening", id);
    },

    moveZoneTo: (id, deltaM) => {
      const command = buildZoneMoveCommand(get().document, id, deltaM);
      if (command) get().runCommand(command);
    },
    updateZoneAttributes: (id, patch) => {
      const command = buildZoneAttributesCommand(get().document, id, patch);
      if (command) get().runCommand(command);
    },
    removeZone: (id) => {
      const command = buildZoneRemoveCommand(get().document, id);
      if (command) get().runCommand(command);
      clearSelectionOf("zone", id);
    },

    // "surface" no está: un muro no se borra suelto, sale de la planta. Borrarlo tendría que
    // significar "fusionar sus dos vértices", que es otra operación y con otro nombre.
    deleteSelection: () => {
      const selection = get().selection;
      if (!selection) return;

      if (selection.kind === "vertex") get().removeVertexAt(selection.index);
      if (selection.kind === "obstacle") get().removeObstacle(selection.id);
      if (selection.kind === "opening") get().removeOpening(selection.id);
      if (selection.kind === "zone") get().removeZone(selection.id);
    },
  };
}
