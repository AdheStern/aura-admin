// src/features/signal-flow/rules/detect-cycle.ts — busca un lazo en el grafo ya guardado.
//
// canConnect impide cerrarlos mientras se dibuja, pero Scene.signalFlow es JSONB y una Server
// Action es un endpoint invocable directo: el documento que llega al servidor no tiene por qué
// haber pasado por el editor. Sin esta red, un lazo colgaría los recorridos de la tarea 3.
//
// DFS con tres colores (sin visitar / en la pila / cerrado): un arco hacia un nodo que sigue en la
// pila es el lazo. Devuelve el ciclo encontrado para que el mensaje nombre los nodos implicados.

import type { GraphIndex } from "@/features/signal-flow/model/graph-index";

export function detectCycle(index: GraphIndex): string[] | null {
  const closed = new Set<string>();
  const stack: string[] = [];
  const onStack = new Set<string>();

  for (const nodeId of index.nodes.keys()) {
    if (closed.has(nodeId)) continue;
    const cycle = visit(index, nodeId, { closed, stack, onStack });
    if (cycle) return cycle;
  }
  return null;
}

type WalkState = {
  closed: Set<string>;
  stack: string[];
  onStack: Set<string>;
};

function visit(
  index: GraphIndex,
  nodeId: string,
  state: WalkState,
): string[] | null {
  state.stack.push(nodeId);
  state.onStack.add(nodeId);

  for (const edge of index.outgoingByNode.get(nodeId) ?? []) {
    if (state.onStack.has(edge.target)) {
      return state.stack.slice(state.stack.indexOf(edge.target));
    }
    if (state.closed.has(edge.target)) continue;

    const cycle = visit(index, edge.target, state);
    if (cycle) return cycle;
  }

  state.stack.pop();
  state.onStack.delete(nodeId);
  state.closed.add(nodeId);
  return null;
}
