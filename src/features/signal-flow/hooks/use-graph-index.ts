// src/features/signal-flow/hooks/use-graph-index.ts — el grafo resuelto que el panel necesita para
// preguntarle al dominio cosas que no caben en el estado del store (potencia, programa).
//
// Reconstruirlo es barato —decenas de nodos, no miles— y useMemo lo limita a los cambios que de
// verdad lo alteran. El viewport se pasa fijo a propósito: el índice no lo mira, y encadenarlo
// haría que arrastrar el lienzo recalculara la resolución eléctrica en cada frame.

"use client";

import { useMemo } from "react";
import { toSignalFlowDocument } from "@/features/signal-flow/mapping/react-flow-adapter";
import {
  buildGraphIndex,
  type GraphIndex,
} from "@/features/signal-flow/model/graph-index";
import { hydrateFlow } from "@/features/signal-flow/model/resolved-flow";
import { useFlowStore } from "@/features/signal-flow/store/flow-store-provider";

const IGNORED_VIEWPORT = { x: 0, y: 0, zoom: 1 };

export function useGraphIndex(): GraphIndex {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const snapshot = useFlowStore((state) => state.library.snapshot);

  return useMemo(
    () =>
      buildGraphIndex(
        hydrateFlow(
          toSignalFlowDocument(nodes, edges, IGNORED_VIEWPORT),
          snapshot,
        ),
      ),
    [nodes, edges, snapshot],
  );
}
