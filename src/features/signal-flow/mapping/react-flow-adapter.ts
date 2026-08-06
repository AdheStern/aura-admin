// src/features/signal-flow/mapping/react-flow-adapter.ts — frontera entre el documento del dominio
// y el estado que React Flow necesita. signalFlowDocumentSchema es `strictObject` a propósito
// (Sección schemas/signal-flow.ts): un nodo de React Flow trae `selected`, `dragging`, `measured`,
// `width`… que no son parte del grafo, y colarlos en Scene.signalFlow es justo lo que el schema
// estricto corta. Estas dos funciones son la única costura permitida entre ambos mundos.

import type { Edge, Node, Viewport } from "@xyflow/react";
import type { FlowNodeData } from "@/features/signal-flow/schemas/node-data";
import {
  EMPTY_SIGNAL_FLOW,
  type SignalFlowDocument,
} from "@/features/signal-flow/schemas/signal-flow";

export type FlowRfNode = Node<FlowNodeData, FlowNodeData["kind"]>;
export type FlowRfEdge = Edge<Record<string, never>>;

export function toSignalFlowDocument(
  nodes: readonly FlowRfNode[],
  edges: readonly FlowRfEdge[],
  viewport: Viewport,
): SignalFlowDocument {
  return {
    schemaVersion: "1",
    nodes: nodes.map((node) => ({
      id: node.id,
      position: node.position,
      data: node.data,
    })),
    // sourceHandle/targetHandle solo faltan si algo fuera de connect() creó la arista a mano; se
    // descartan en vez de fallar el guardado por una arista que de todos modos no dice a qué
    // puertos une.
    edges: edges.flatMap((edge) =>
      edge.sourceHandle && edge.targetHandle
        ? [
            {
              id: edge.id,
              source: edge.source,
              sourceHandle: edge.sourceHandle,
              target: edge.target,
              targetHandle: edge.targetHandle,
            },
          ]
        : [],
    ),
    viewport,
  };
}

export function toReactFlowState(document: SignalFlowDocument): {
  nodes: FlowRfNode[];
  edges: FlowRfEdge[];
  viewport: Viewport;
} {
  return {
    nodes: document.nodes.map((node) => ({
      id: node.id,
      type: node.data.kind,
      position: node.position,
      data: node.data,
    })),
    edges: document.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: edge.target,
      targetHandle: edge.targetHandle,
    })),
    viewport: document.viewport,
  };
}

export const EMPTY_REACT_FLOW_STATE = toReactFlowState(EMPTY_SIGNAL_FLOW);
