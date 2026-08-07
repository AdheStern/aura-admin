// src/features/room-editor/store/room-store.ts — slice único del editor de recinto (Sección 5 del
// doc maestro). Store vanilla por el mismo motivo que flow-store.ts: se instancia una vez POR
// MONTAJE de <RoomEditor> (ver room-store-provider.tsx), nunca como singleton de módulo.
//
// document/history/toRoomGeometry/validateRoom (Tarea 1) son la única fuente de verdad: este store
// solo los invoca (aquí y en room-store-helpers.ts) sobre lo que Konva reporta, nunca reimplementa
// la regla. El despacho de herramientas sigue el mismo principio con tools/tool-registry.ts: el
// store aplica el ToolResult que la herramienta calcula, nunca decide por su cuenta qué comando
// emitir un clic.

import { createStore } from "zustand/vanilla";
import { EMPTY_ROOM_HISTORY } from "@/features/room-editor/history/room-history";
import {
  redoRoomCommand,
  runRoomCommand,
  undoRoomCommand,
} from "@/features/room-editor/history/room-session";
import { DEFAULT_CANVAS_VIEWPORT } from "@/features/room-editor/model/canvas-transform";
import { createEntityActions } from "@/features/room-editor/store/room-store-entity-actions";
import { revalidate } from "@/features/room-editor/store/room-store-helpers";
import type {
  RoomStoreInit,
  RoomStoreState,
} from "@/features/room-editor/store/room-store-types";
import { ROOM_TOOLS } from "@/features/room-editor/tools/tool-registry";
import {
  IDLE_DRAFT,
  type ToolResult,
} from "@/features/room-editor/tools/tool-types";

export type {
  RoomStoreInit,
  RoomStoreState,
  SaveStatus,
} from "@/features/room-editor/store/room-store-types";

export function createRoomStore(init: RoomStoreInit) {
  return createStore<RoomStoreState>()((set, get) => {
    function applyToolResult(result: ToolResult): void {
      if (result.draft !== undefined) set({ draft: result.draft });
      if (result.select !== undefined) set({ selection: result.select });
      if (result.command) get().runCommand(result.command);
    }

    return {
      ...init,
      history: EMPTY_ROOM_HISTORY,
      selection: null,
      activeTool: "select",
      draft: IDLE_DRAFT,
      canvasViewport: DEFAULT_CANVAS_VIEWPORT,
      saveStatus: "idle",

      runCommand: (command) => {
        const session = runRoomCommand(
          { document: get().document, history: get().history },
          command,
          Date.now(),
        );
        set({ document: session.document, history: session.history });
        revalidate(set, get);
      },
      undo: () => {
        const session = undoRoomCommand({
          document: get().document,
          history: get().history,
        });
        set({ document: session.document, history: session.history });
        revalidate(set, get);
      },
      redo: () => {
        const session = redoRoomCommand({
          document: get().document,
          history: get().history,
        });
        set({ document: session.document, history: session.history });
        revalidate(set, get);
      },

      setActiveTool: (tool) =>
        set({ activeTool: tool, draft: IDLE_DRAFT, selection: null }),

      handlePointerDown: (pointM) => {
        const state = get();
        applyToolResult(
          ROOM_TOOLS[state.activeTool].onPointerDown(
            pointM,
            state.draft,
            state.document,
          ),
        );
      },
      handlePointerMove: (pointM) => {
        const state = get();
        const handler = ROOM_TOOLS[state.activeTool].onPointerMove;
        if (handler)
          applyToolResult(handler(pointM, state.draft, state.document));
      },
      handlePointerUp: (pointM) => {
        const state = get();
        const handler = ROOM_TOOLS[state.activeTool].onPointerUp;
        if (handler)
          applyToolResult(handler(pointM, state.draft, state.document));
      },
      handleEnterKey: () => {
        const state = get();
        const handler = ROOM_TOOLS[state.activeTool].onEnter;
        if (handler) applyToolResult(handler(state.draft, state.document));
      },
      handleEscapeKey: () => set({ draft: IDLE_DRAFT }),

      select: (selection) => set({ selection }),
      setCanvasViewport: (viewport) => set({ canvasViewport: viewport }),
      importDocument: (document) => {
        get().runCommand({ kind: "replaceDocument", document });
        set({ selection: null, draft: IDLE_DRAFT });
      },

      ...createEntityActions(set, get),

      setSaveStatus: (status) => set({ saveStatus: status }),
      applySaveResult: ({ status, errors, warnings }) =>
        set({
          sceneStatus: status,
          validation: { isComplete: errors.length === 0, errors, warnings },
          saveStatus: "saved",
        }),
    };
  });
}

export type RoomStore = ReturnType<typeof createRoomStore>;
