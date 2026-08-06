// src/features/signal-flow/components/nodes/node-hooks.ts — lo que cada nodo necesita del store
// pero React Flow no le pasa por props: el spec resuelto (para portsOf) y los issues que le tocan.
//
// useResolvedNode reusa hydrateFlow con un documento de un solo nodo en vez de reimplementar la
// resolución de spec: es barato (un nodo, cero aristas) y mantiene una sola fuente de verdad para
// "qué significa que un nodo tenga item_missing/unsupported_version" entre el editor y el dominio.
//
// useNodeIssues selecciona `validation` tal cual (referencia estable: solo cambia cuando el store
// la reasigna de verdad) y filtra con useMemo — nunca dentro del selector de useStore. Un selector
// de Zustand que devuelve un objeto/array NUEVO en cada llamada (aquí, el resultado de .filter())
// rompe useSyncExternalStore: cada render produce una snapshot "distinta" por referencia y React
// entra en bucle ("Maximum update depth exceeded").

"use client";

import { useMemo } from "react";
import {
  hydrateFlow,
  type ResolvedNode,
} from "@/features/signal-flow/model/resolved-flow";
import type { FlowNodeData } from "@/features/signal-flow/schemas/node-data";
import { useFlowStore } from "@/features/signal-flow/store/flow-store-provider";
import type { FlowIssue } from "@/features/signal-flow/validation/issue-codes";

export function useResolvedNode(
  nodeId: string,
  data: FlowNodeData,
): ResolvedNode {
  const snapshot = useFlowStore((state) => state.library.snapshot);

  return hydrateFlow(
    {
      schemaVersion: "1",
      nodes: [{ id: nodeId, position: { x: 0, y: 0 }, data }],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    },
    snapshot,
  ).nodes[0];
}

export function useNodeIssues(nodeId: string): {
  errors: FlowIssue[];
  warnings: FlowIssue[];
} {
  const validation = useFlowStore((state) => state.validation);

  return useMemo(
    () => ({
      errors: validation.errors.filter((issue) => issue.nodeId === nodeId),
      warnings: validation.warnings.filter((issue) => issue.nodeId === nodeId),
    }),
    [validation, nodeId],
  );
}
