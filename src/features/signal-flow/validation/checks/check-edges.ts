// src/features/signal-flow/validation/checks/check-edges.ts — revalida las aristas ya guardadas.
//
// No basta con que canConnect las aprobara al dibujarlas: entre medias alguien pudo editar el
// datasheet de la consola y bajar io.inputChannels de 32 a 16, dejando aristas apuntando a canales
// que ya no existen. Ese es el caso que PORT_OUT_OF_RANGE persigue, y solo se ve al revalidar.
//
// Las aristas de nodos con catálogo sin resolver se saltan a propósito: sin spec no hay puertos,
// así que TODAS parecerían fuera de rango y el usuario leería quince errores en vez del que importa.

import {
  type GraphIndex,
  nodeOf,
  portKey,
} from "@/features/signal-flow/model/graph-index";
import {
  type FlowPort,
  findPort,
} from "@/features/signal-flow/model/node-ports";
import type { ResolvedNode } from "@/features/signal-flow/model/resolved-flow";
import { canCarry } from "@/features/signal-flow/model/signal-domain";
import { connectionRejectionMessage } from "@/features/signal-flow/rules/connection-rejection";
import { detectCycle } from "@/features/signal-flow/rules/detect-cycle";
import type { FlowEdge } from "@/features/signal-flow/schemas/signal-flow";
import {
  type FlowIssue,
  flowIssue,
} from "@/features/signal-flow/validation/issue-codes";

export function checkEdges(index: GraphIndex): FlowIssue[] {
  const issues = index.edges.flatMap((edge) => checkEdge(index, edge));
  return [...issues, ...checkPortCapacity(index), ...checkCycles(index)];
}

function checkEdge(index: GraphIndex, edge: FlowEdge): FlowIssue[] {
  const sourceNode = nodeOf(index, edge.source);
  const targetNode = nodeOf(index, edge.target);
  if (!sourceNode || !targetNode) {
    return [dangling(edge, "Une nodos que ya no existen.")];
  }
  if (hasUnresolvedCatalog(sourceNode) || hasUnresolvedCatalog(targetNode)) {
    return [];
  }

  const sourcePort = findPort(sourceNode, edge.sourceHandle);
  const targetPort = findPort(targetNode, edge.targetHandle);
  if (!sourcePort || !targetPort) {
    return [dangling(edge, "Apunta a un conector que el equipo ya no tiene.")];
  }
  return checkPortPair(edge, sourcePort, targetPort);
}

function checkPortPair(
  edge: FlowEdge,
  sourcePort: FlowPort,
  targetPort: FlowPort,
): FlowIssue[] {
  const invalid = (message: string) => [
    flowIssue("INVALID_CONNECTION", message, { edgeId: edge.id }),
  ];

  if (sourcePort.direction !== "out" || targetPort.direction !== "in") {
    return invalid("Va de entrada a salida, no al revés.");
  }
  if (!canCarry(sourcePort.domain, targetPort.domain)) {
    return invalid(
      connectionRejectionMessage({
        code: "DOMAIN_MISMATCH",
        from: sourcePort.domain,
        to: targetPort.domain,
      }),
    );
  }
  return [];
}

function checkPortCapacity(index: GraphIndex): FlowIssue[] {
  const issues: FlowIssue[] = [];

  for (const node of index.nodes.values()) {
    if (hasUnresolvedCatalog(node)) continue;

    for (const edge of index.incomingByNode.get(node.id) ?? []) {
      const port = findPort(node, edge.targetHandle);
      const arriving = index.byTargetPort.get(
        portKey(node.id, edge.targetHandle),
      );
      if (!port || !arriving || arriving.length <= port.maxConnections)
        continue;
      if (arriving[0] !== edge) continue; // un aviso por puerto, no uno por arista

      issues.push(
        flowIssue(
          "PORT_OVERSUBSCRIBED",
          `"${port.label}" admite ${port.maxConnections} conexión y recibe ${arriving.length}.`,
          { nodeId: node.id, edgeId: edge.id },
        ),
      );
    }
  }
  return issues;
}

function checkCycles(index: GraphIndex): FlowIssue[] {
  const cycle = detectCycle(index);
  if (!cycle) return [];

  return cycle.map((nodeId) =>
    flowIssue(
      "CYCLE_DETECTED",
      "Este nodo forma un lazo: la señal vuelve sobre sí misma.",
      { nodeId },
    ),
  );
}

function hasUnresolvedCatalog(node: ResolvedNode): boolean {
  return node.specStatus !== "resolved" && node.specStatus !== "not_applicable";
}

function dangling(edge: FlowEdge, message: string): FlowIssue {
  return flowIssue("PORT_OUT_OF_RANGE", message, { edgeId: edge.id });
}
