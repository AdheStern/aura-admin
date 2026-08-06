// src/features/signal-flow/validation/checks/check-wiring-hygiene.ts — montajes raros pero simulables.
// Todo lo de aquí es AVISO: el sistema se puede compilar y simular, pero el cableado delata algo
// a medio hacer o poco habitual. Nada de esto bloquea FLOW_READY.

import {
  edgesIntoPort,
  edgesOutOfPort,
  type GraphIndex,
  nodesOfKind,
} from "@/features/signal-flow/model/graph-index";
import { flowNodeLabel } from "@/features/signal-flow/model/node-registry";
import { NAMED_PORT_IDS } from "@/features/signal-flow/schemas/port-ids";
import {
  type FlowIssue,
  flowIssue,
} from "@/features/signal-flow/validation/issue-codes";

export function checkWiringHygiene(index: GraphIndex): FlowIssue[] {
  return [
    ...checkSources(index),
    ...checkMicrophones(index),
    ...checkOrphans(index),
  ];
}

type SourceNode = ReturnType<typeof nodesOfKind<"source">>[number];

function checkSources(index: GraphIndex): FlowIssue[] {
  return nodesOfKind(index, "source").flatMap((source) => {
    const overTheAir = edgesOutOfPort(
      index,
      source.id,
      NAMED_PORT_IDS.sourceAcoustic,
    ).length;
    const overTheLine = edgesOutOfPort(
      index,
      source.id,
      NAMED_PORT_IDS.sourceDirect,
    ).length;

    if (overTheAir === 0 && overTheLine === 0) {
      return [
        flowIssue("SOURCE_NOT_ROUTED", "Esta fuente no va a ninguna parte.", {
          nodeId: source.id,
        }),
      ];
    }
    return overTheLine > 0 ? checkDirectLine(source) : [];
  });
}

// spec.amplified dice si el instrumento tiene salida eléctrica propia. Que no la tenga no impide
// la conexión (un cajón con pastilla, una batería con triggers), pero casi siempre significa que
// el usuario quiso pasar por micrófono y se saltó el nodo.
function checkDirectLine(source: SourceNode): FlowIssue[] {
  if (source.spec?.amplified !== false) return [];

  return [
    flowIssue(
      "UNAMPLIFIED_SOURCE_DIRECT_LINE",
      `"${source.spec.name}" no es una fuente amplificada: por línea asume DI o pastilla, no micrófono.`,
      { nodeId: source.id },
    ),
  ];
}

function checkMicrophones(index: GraphIndex): FlowIssue[] {
  return nodesOfKind(index, "microphone")
    .filter(
      (mic) => edgesIntoPort(index, mic.id, NAMED_PORT_IDS.input).length === 0,
    )
    .map((mic) =>
      flowIssue(
        "MICROPHONE_WITHOUT_SOURCE",
        "Micrófono sin fuente delante: no captaría nada del sistema.",
        { nodeId: mic.id },
      ),
    );
}

// Solo consolas y PA: los demás tipos sin cablear ya tienen su propio aviso más específico
// (la fuente, SOURCE_NOT_ROUTED; el micro, MICROPHONE_WITHOUT_SOURCE; la caja, sin alimentación).
function checkOrphans(index: GraphIndex): FlowIssue[] {
  const candidates = [
    ...nodesOfKind(index, "console"),
    ...nodesOfKind(index, "pa"),
  ];

  return candidates
    .filter(
      (node) =>
        (index.incomingByNode.get(node.id)?.length ?? 0) === 0 &&
        (index.outgoingByNode.get(node.id)?.length ?? 0) === 0,
    )
    .map((node) =>
      flowIssue(
        "ORPHAN_NODE",
        `${flowNodeLabel(node.kind)} suelto: no está conectado a nada.`,
        { nodeId: node.id },
      ),
    );
}
