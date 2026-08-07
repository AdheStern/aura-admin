// src/features/room-editor/store/room-store-types.ts — tipos del store del editor de recinto,
// separados de room-store.ts por la misma razón que en flow-store-types.ts: el archivo combinado
// pasaba de las 150 líneas que la Sección 9.3 fija como objetivo para un store Zustand.

import type { RoomHistory } from "@/features/room-editor/history/room-history";
import type { CanvasViewport } from "@/features/room-editor/model/canvas-transform";
import type { MaterialPickerOption } from "@/features/room-editor/queries/list-room-material-options";
import type { RoomCommand } from "@/features/room-editor/schemas/room-command";
import type {
  Point2d,
  RoomDocument,
  RoomObstacle,
  RoomOpening,
} from "@/features/room-editor/schemas/room-document";
import type { RoomSelection } from "@/features/room-editor/store/room-selection";
import type {
  RoomDraft,
  RoomToolKind,
} from "@/features/room-editor/tools/tool-types";
import type { RoomValidation } from "@/features/room-editor/validation/validate-room";
import type { SceneStatus } from "@/features/scenes/schemas";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Firma mínima de zustand/vanilla que room-store-helpers.ts y room-store-entity-actions.ts
 *  necesitan: les basta con leer/escribir el estado, no con el resto de la StoreApi. */
export type RoomStoreSet = (partial: Partial<RoomStoreState>) => void;
export type RoomStoreGet = () => RoomStoreState;

export type RoomStoreState = {
  sceneId: string;
  canManage: boolean;
  document: RoomDocument;
  history: RoomHistory;
  materialOptions: MaterialPickerOption[];
  materialIds: ReadonlySet<string>;
  selection: RoomSelection | null;
  activeTool: RoomToolKind;
  draft: RoomDraft;
  canvasViewport: CanvasViewport;
  sceneStatus: SceneStatus;
  validation: RoomValidation;
  saveStatus: SaveStatus;

  runCommand: (command: RoomCommand) => void;
  undo: () => void;
  redo: () => void;

  setActiveTool: (tool: RoomToolKind) => void;
  handlePointerDown: (pointM: Point2d) => void;
  handlePointerMove: (pointM: Point2d) => void;
  handlePointerUp: (pointM: Point2d) => void;
  handleEnterKey: () => void;
  handleEscapeKey: () => void;

  select: (selection: RoomSelection | null) => void;
  setCanvasViewport: (viewport: CanvasViewport) => void;
  /** Importar JSON (Tarea 3): reemplaza el documento entero de una vez, deshacible como cualquier
   *  otro comando — ver replaceDocument en schemas/room-command.ts. */
  importDocument: (document: RoomDocument) => void;

  moveVertexTo: (index: number, pointM: Point2d) => void;
  removeVertexAt: (index: number) => void;
  insertVertexAt: (edgeIndex: number, pointM: Point2d) => void;
  setHeightM: (heightM: number) => void;
  setSurfaceMaterial: (surfaceId: string, materialId: string | null) => void;
  updateObstacle: (
    id: string,
    patch: Partial<Pick<RoomObstacle, "at" | "size" | "materialId">>,
  ) => void;
  removeObstacle: (id: string) => void;
  updateOpening: (
    id: string,
    patch: Partial<Pick<RoomOpening, "rect" | "materialId">>,
  ) => void;
  removeOpening: (id: string) => void;
  moveZoneTo: (id: string, deltaM: Point2d) => void;
  updateZoneAttributes: (
    id: string,
    patch: { earHeightOrElevation: number; seated?: boolean },
  ) => void;
  removeZone: (id: string) => void;
  /** Borra la figura seleccionada, sea del tipo que sea. Lo comparten la tecla Supr y —vía
   *  selección— el resto de la UI; un muro seleccionado no se borra (ver la nota en la acción). */
  deleteSelection: () => void;

  setSaveStatus: (status: SaveStatus) => void;
  applySaveResult: (result: { status: SceneStatus } & RoomValidation) => void;
};

export type RoomStoreInit = Pick<
  RoomStoreState,
  | "sceneId"
  | "canManage"
  | "document"
  | "materialOptions"
  | "materialIds"
  | "sceneStatus"
  | "validation"
>;
