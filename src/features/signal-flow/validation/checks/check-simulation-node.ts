// src/features/signal-flow/validation/checks/check-simulation-node.ts — el sumidero del sistema.
// Un grafo sin nodo simulation, o con dos, no describe "un" recinto: no habría a qué compilar.

import {
  edgesIntoPort,
  type GraphIndex,
  nodeOf,
  nodesOfKind,
} from "@/features/signal-flow/model/graph-index";
import { NAMED_PORT_IDS } from "@/features/signal-flow/schemas/port-ids";
import {
  type FlowIssue,
  flowIssue,
} from "@/features/signal-flow/validation/issue-codes";

export function checkSimulationNode(index: GraphIndex): FlowIssue[] {
  const simulationNodes = nodesOfKind(index, "simulation");

  if (simulationNodes.length === 0) {
    return [
      flowIssue(
        "SIMULATION_NODE_MISSING",
        "Falta el nodo de simulación: es donde desembocan los parlantes.",
      ),
    ];
  }
  if (simulationNodes.length > 1) {
    return simulationNodes
      .slice(1)
      .map((node) =>
        flowIssue(
          "SIMULATION_NODE_DUPLICATED",
          "Solo puede haber un nodo de simulación por escena.",
          { nodeId: node.id },
        ),
      );
  }

  return checkHasSpeakers(index, simulationNodes[0].id);
}

function checkHasSpeakers(index: GraphIndex, nodeId: string): FlowIssue[] {
  const feeding = edgesIntoPort(index, nodeId, NAMED_PORT_IDS.input).filter(
    (edge) => nodeOf(index, edge.source)?.kind === "speaker",
  );

  return feeding.length > 0
    ? []
    : [
        flowIssue(
          "NO_SPEAKER_IN_SIMULATION",
          "Ningún parlante llega a la simulación: no hay nada que sonar en el recinto.",
          { nodeId },
        ),
      ];
}
