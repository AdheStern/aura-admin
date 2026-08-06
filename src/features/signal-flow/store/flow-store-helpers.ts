// src/features/signal-flow/store/flow-store-helpers.ts — funciones puras que comparte
// createFlowStore: reconstruyen el ResolvedFlow desde el estado actual del editor para pedirle al
// dominio (Tarea 1) el veredicto de una conexión o de la validación completa. Ninguna reimplementa
// la regla — solo la invocan sobre lo que React Flow trae en el store.

import type { Connection } from "@xyflow/react";
import {
  type FlowRfEdge,
  type FlowRfNode,
  toSignalFlowDocument,
} from "@/features/signal-flow/mapping/react-flow-adapter";
import { buildGraphIndex } from "@/features/signal-flow/model/graph-index";
import {
  catalogSnapshotKey,
  type FlowCatalogSnapshot,
  hydrateFlow,
} from "@/features/signal-flow/model/resolved-flow";
import { canConnect } from "@/features/signal-flow/rules/can-connect";
import type { SourceOutputMode } from "@/features/signal-flow/schemas/node-data";
import type { FlowStoreState } from "@/features/signal-flow/store/flow-store-types";
import { validateSignalFlow } from "@/features/signal-flow/validation/validate-signal-flow";

export function hasSimulationNode(nodes: readonly FlowRfNode[]): boolean {
  return nodes.some((node) => node.data.kind === "simulation");
}

/**
 * Estéreo por defecto en la familia `keys`, mono en el resto.
 *
 * Sintetizadores y pianos digitales salen por L y R salvo que se decida sumarlos; el resto de
 * familias del catálogo son mono de origen. Es solo el punto de partida al elegir el ítem: el
 * usuario lo cambia después en el panel, porque el modo depende del montaje y no del instrumento.
 */
export function defaultSourceOutputMode(
  snapshot: FlowCatalogSnapshot,
  catalogItemId: string | null,
): SourceOutputMode {
  if (!catalogItemId) return "mono";

  const entry = snapshot.get(catalogSnapshotKey("source", catalogItemId));
  return entry?.kind === "source" && entry.spec.kind === "keys"
    ? "stereo"
    : "mono";
}

export function checkConnection(
  state: FlowStoreState,
  connection: Connection | FlowRfEdge,
) {
  if (!connection.sourceHandle || !connection.targetHandle) {
    return {
      ok: false as const,
      rejection: { code: "PORT_NOT_FOUND" as const },
      message: "",
    };
  }
  const index = buildGraphIndex(
    hydrateFlow(
      toSignalFlowDocument(state.nodes, state.edges, state.viewport),
      state.library.snapshot,
    ),
  );
  return canConnect(index, {
    source: connection.source,
    sourceHandle: connection.sourceHandle,
    target: connection.target,
    targetHandle: connection.targetHandle,
  });
}

export function revalidate(
  set: (partial: Partial<FlowStoreState>) => void,
  get: () => FlowStoreState,
): void {
  const state = get();
  const resolved = hydrateFlow(
    toSignalFlowDocument(state.nodes, state.edges, state.viewport),
    state.library.snapshot,
  );
  set({ validation: validateSignalFlow(resolved) });
}
