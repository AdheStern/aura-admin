// src/features/signal-flow/store/flow-store.ts — slice único del editor de flujo (Sección 5 del
// doc maestro). Store vanilla (no el hook `create()`) porque se instancia una vez POR MONTAJE de
// <FlowEditor> (ver flow-store-provider.tsx): un singleton a nivel de módulo arrastraría el grafo
// de la escena anterior si el usuario navega de una escena a otra sin recarga completa.
//
// canConnect/hydrateFlow/validateSignalFlow del dominio (Tarea 1) son la única fuente de verdad:
// este store solo los invoca (en flow-store-helpers.ts) sobre el estado que React Flow controla,
// nunca reimplementa la regla.

import { applyEdgeChanges, applyNodeChanges } from "@xyflow/react";
import { createStore } from "zustand/vanilla";
import type { FlowRfNode } from "@/features/signal-flow/mapping/react-flow-adapter";
import { flowNodeDataSchema } from "@/features/signal-flow/schemas/node-data";
import {
  checkConnection,
  hasSimulationNode,
  revalidate,
} from "@/features/signal-flow/store/flow-store-helpers";
import type {
  FlowStoreInit,
  FlowStoreState,
} from "@/features/signal-flow/store/flow-store-types";

export type {
  FlowStoreInit,
  FlowStoreState,
  SaveStatus,
  SpeakerSettingsPatch,
} from "@/features/signal-flow/store/flow-store-types";

export function createFlowStore(init: FlowStoreInit) {
  return createStore<FlowStoreState>()((set, get) => ({
    ...init,
    selectedNodeId: null,
    saveStatus: "idle",

    onNodesChange: (changes) => {
      set((state) => ({ nodes: applyNodeChanges(changes, state.nodes) }));
      revalidate(set, get);
    },

    onEdgesChange: (changes) => {
      set((state) => ({ edges: applyEdgeChanges(changes, state.edges) }));
      revalidate(set, get);
    },

    isValidConnection: (connection) => checkConnection(get(), connection).ok,

    connect: (connection) => {
      const check = checkConnection(get(), connection);
      if (!check.ok || !connection.sourceHandle || !connection.targetHandle) {
        return;
      }
      const edge = {
        id: `${connection.source}.${connection.sourceHandle}->${connection.target}.${connection.targetHandle}`,
        source: connection.source,
        sourceHandle: connection.sourceHandle,
        target: connection.target,
        targetHandle: connection.targetHandle,
      };
      set((state) => ({ edges: [...state.edges, edge] }));
      revalidate(set, get);
    },

    // El viewport no participa en ninguna regla del validador: solo se sincroniza para que el
    // autosave lo incluya en el documento guardado, nunca dispara revalidate().
    setViewport: (viewport) => set({ viewport }),

    addNode: (kind, position) => {
      if (kind === "simulation" && hasSimulationNode(get().nodes)) return;

      const data = flowNodeDataSchema.parse(
        kind === "simulation" ? { kind } : { kind, catalogItemId: null },
      );
      const node: FlowRfNode = {
        id: crypto.randomUUID(),
        type: kind,
        position,
        data,
      };
      set((state) => ({ nodes: [...state.nodes, node] }));
      revalidate(set, get);
    },

    setNodeCatalogItem: (nodeId, catalogItemId) => {
      set((state) => ({
        nodes: state.nodes.map((node) => {
          if (node.id !== nodeId || node.data.kind === "simulation") {
            return node;
          }
          return { ...node, data: { ...node.data, catalogItemId } };
        }),
      }));
      revalidate(set, get);
    },

    // Nivel/polaridad/delay no cambian puertos ni conexiones: ningún check del validador los lee,
    // así que no hace falta revalidar (evita reconstruir el índice del grafo en cada tecleo).
    updateSpeakerSettings: (nodeId, patch) => {
      set((state) => ({
        nodes: state.nodes.map((node) => {
          if (node.id !== nodeId || node.data.kind !== "speaker") return node;
          return { ...node, data: { ...node.data, ...patch } };
        }),
      }));
    },

    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
    setSaveStatus: (status) => set({ saveStatus: status }),

    applySaveResult: ({ status, errors, warnings }) =>
      set({
        sceneStatus: status,
        validation: { isComplete: errors.length === 0, errors, warnings },
        saveStatus: "saved",
      }),
  }));
}

export type FlowStore = ReturnType<typeof createFlowStore>;
