// src/features/room-3d/store/speaker-store.tsx — el estado de los parlantes en el editor 3D.
//
// Store aparte del de recinto a propósito, y la frontera es la del dueño del dato: la COLOCACIÓN
// es del recinto y va por runCommand del room-store (con su historial y su autosave), mientras que
// nivel/polaridad/delay son del NODO del grafo y se parchean con su propia action. Meterlos en el
// room-store obligaría al editor 2D —que no sabe de parlantes— a construir e inyectar esta mitad.
//
// `speakers` no cambia en toda la sesión: el grafo es de solo lectura desde aquí (§5.3: las cajas
// no se crean en el 3D). Lo único mutable es el audio, y `dirtyNodeIds` es lo que el autosave usa
// para mandar solo lo tocado en vez de reescribir el grafo entero.

"use client";

import { createContext, type ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type { SceneSpeaker } from "@/features/room-3d/queries/list-scene-speakers";
import type { SpeakerAudio } from "@/features/signal-flow/schemas/node-data";

export type SpeakerStoreInit = {
  sceneId: string;
  canManage: boolean;
  speakers: SceneSpeaker[];
};

export type SpeakerStoreState = SpeakerStoreInit & {
  audioByNodeId: Record<string, SpeakerAudio>;
  dirtyNodeIds: string[];
  /** Trasladar y rotar comparten gizmo: TransformControls hace una cosa a la vez. */
  gizmoMode: "translate" | "rotate";
  setSpeakerAudio: (nodeId: string, patch: Partial<SpeakerAudio>) => void;
  setGizmoMode: (mode: SpeakerStoreState["gizmoMode"]) => void;
  clearDirty: (nodeIds: string[]) => void;
};

export type SpeakerStore = ReturnType<typeof createSpeakerStore>;

export function createSpeakerStore(init: SpeakerStoreInit) {
  return createStore<SpeakerStoreState>()((set, get) => ({
    ...init,
    audioByNodeId: Object.fromEntries(
      init.speakers.map((speaker) => [speaker.nodeId, speaker.audio]),
    ),
    dirtyNodeIds: [],
    gizmoMode: "translate",

    setGizmoMode: (gizmoMode) => set({ gizmoMode }),

    setSpeakerAudio: (nodeId, patch) => {
      const current = get().audioByNodeId[nodeId];
      if (!current) return;

      set({
        audioByNodeId: {
          ...get().audioByNodeId,
          [nodeId]: { ...current, ...patch },
        },
        dirtyNodeIds: get().dirtyNodeIds.includes(nodeId)
          ? get().dirtyNodeIds
          : [...get().dirtyNodeIds, nodeId],
      });
    },

    clearDirty: (nodeIds) =>
      set({
        dirtyNodeIds: get().dirtyNodeIds.filter((id) => !nodeIds.includes(id)),
      }),
  }));
}

const SpeakerStoreContext = createContext<SpeakerStore | null>(null);

export function SpeakerStoreProvider({
  init,
  children,
}: {
  init: SpeakerStoreInit;
  children: ReactNode;
}) {
  const storeRef = useRef<SpeakerStore | null>(null);
  storeRef.current ??= createSpeakerStore(init);

  return (
    <SpeakerStoreContext.Provider value={storeRef.current}>
      {children}
    </SpeakerStoreContext.Provider>
  );
}

export function useSpeakerStore<T>(
  selector: (state: SpeakerStoreState) => T,
): T {
  const store = useContext(SpeakerStoreContext);
  if (!store) {
    throw new Error(
      "useSpeakerStore debe usarse dentro de <SpeakerStoreProvider>",
    );
  }
  return useStore(store, selector);
}
