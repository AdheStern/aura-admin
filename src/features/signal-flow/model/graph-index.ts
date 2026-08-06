// src/features/signal-flow/model/graph-index.ts — índice de adyacencia del grafo resuelto.
// Se construye una vez por validación y lo comparten las reglas de conexión, el validador y —en la
// tarea 3— la resolución eléctrica y de espectros de programa. Sin él cada regla recorrería el
// array de aristas entero, y con encadenado de cajas eso deja de ser barato.

import type {
  ResolvedFlow,
  ResolvedNode,
} from "@/features/signal-flow/model/resolved-flow";
import type { FlowEdge } from "@/features/signal-flow/schemas/signal-flow";

export type GraphIndex = {
  nodes: ReadonlyMap<string, ResolvedNode>;
  edges: readonly FlowEdge[];
  /** Aristas que llegan a un puerto concreto, clave `${nodeId}:${portId}`. */
  byTargetPort: ReadonlyMap<string, FlowEdge[]>;
  /** Aristas que salen de un puerto concreto, clave `${nodeId}:${portId}`. */
  bySourcePort: ReadonlyMap<string, FlowEdge[]>;
  outgoingByNode: ReadonlyMap<string, FlowEdge[]>;
  incomingByNode: ReadonlyMap<string, FlowEdge[]>;
};

export function portKey(nodeId: string, portId: string): string {
  return `${nodeId}:${portId}`;
}

export function buildGraphIndex(flow: ResolvedFlow): GraphIndex {
  const byTargetPort = new Map<string, FlowEdge[]>();
  const bySourcePort = new Map<string, FlowEdge[]>();
  const outgoingByNode = new Map<string, FlowEdge[]>();
  const incomingByNode = new Map<string, FlowEdge[]>();

  for (const edge of flow.edges) {
    push(byTargetPort, portKey(edge.target, edge.targetHandle), edge);
    push(bySourcePort, portKey(edge.source, edge.sourceHandle), edge);
    push(outgoingByNode, edge.source, edge);
    push(incomingByNode, edge.target, edge);
  }

  return {
    nodes: new Map(flow.nodes.map((node) => [node.id, node])),
    edges: flow.edges,
    byTargetPort,
    bySourcePort,
    outgoingByNode,
    incomingByNode,
  };
}

export function nodeOf(index: GraphIndex, nodeId: string): ResolvedNode | null {
  return index.nodes.get(nodeId) ?? null;
}

export function edgesIntoPort(
  index: GraphIndex,
  nodeId: string,
  portId: string,
): readonly FlowEdge[] {
  return index.byTargetPort.get(portKey(nodeId, portId)) ?? [];
}

export function edgesOutOfPort(
  index: GraphIndex,
  nodeId: string,
  portId: string,
): readonly FlowEdge[] {
  return index.bySourcePort.get(portKey(nodeId, portId)) ?? [];
}

export function nodesOfKind<K extends ResolvedNode["kind"]>(
  index: GraphIndex,
  kind: K,
): Extract<ResolvedNode, { kind: K }>[] {
  const matches: Extract<ResolvedNode, { kind: K }>[] = [];
  for (const node of index.nodes.values()) {
    if (node.kind === kind)
      matches.push(node as Extract<ResolvedNode, { kind: K }>);
  }
  return matches;
}

/**
 * ¿Se llega de `fromNodeId` a `toNodeId` siguiendo la señal hacia adelante?
 *
 * Lo usan dos reglas distintas: detectar que una conexión nueva cerraría un ciclo (el destino ya
 * alcanza al origen) y comprobar que alguna fuente alcanza cada parlante. Con pa→pa y el enlace
 * entre cajas el grafo dejó de ser lineal, así que esto es un recorrido de verdad, no un salto.
 */
export function isReachable(
  index: GraphIndex,
  fromNodeId: string,
  toNodeId: string,
): boolean {
  const visited = new Set<string>([fromNodeId]);
  const pending = [fromNodeId];

  while (pending.length > 0) {
    const current = pending.pop() as string;
    if (current === toNodeId && current !== fromNodeId) return true;

    for (const edge of index.outgoingByNode.get(current) ?? []) {
      if (edge.target === toNodeId) return true;
      if (visited.has(edge.target)) continue;
      visited.add(edge.target);
      pending.push(edge.target);
    }
  }
  return false;
}

function push(map: Map<string, FlowEdge[]>, key: string, edge: FlowEdge): void {
  const bucket = map.get(key);
  if (bucket) bucket.push(edge);
  else map.set(key, [edge]);
}
