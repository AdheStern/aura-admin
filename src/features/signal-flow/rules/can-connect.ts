// src/features/signal-flow/rules/can-connect.ts — la única regla de conexión del proyecto.
// La consume isValidConnection de React Flow (mientras se arrastra) y el validador al guardar: el
// cliente da feedback, el servidor es el que decide, y no pueden discrepar porque es esta función.
//
// El orden de las comprobaciones es deliberado — va de lo estructural a lo físico — para que el
// motivo que se muestra sea el útil: si el conector ni existe, hablar de impedancias despista.

import {
  edgesIntoPort,
  type GraphIndex,
  isReachable,
  nodeOf,
} from "@/features/signal-flow/model/graph-index";
import {
  type FlowPort,
  findPort,
} from "@/features/signal-flow/model/node-ports";
import { canCarry } from "@/features/signal-flow/model/signal-domain";
import {
  type ConnectionRejection,
  connectionRejectionMessage,
} from "@/features/signal-flow/rules/connection-rejection";

export type ConnectionAttempt = {
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
};

export type ConnectionCheck =
  | { ok: true }
  | { ok: false; rejection: ConnectionRejection; message: string };

export function canConnect(
  index: GraphIndex,
  attempt: ConnectionAttempt,
): ConnectionCheck {
  const context = resolveContext(index, attempt);
  if ("rejection" in context) return reject(context.rejection);

  const rejection =
    checkDomains(context) ?? checkCapacity(index, attempt, context.targetPort);
  if (rejection) return reject(rejection);

  // Lo último porque es lo único que recorre el grafo: si algo más lo iba a rechazar, ya lo hizo.
  if (isReachable(index, attempt.target, attempt.source)) {
    return reject({ code: "WOULD_CREATE_CYCLE" });
  }
  return { ok: true };
}

type ConnectionContext = { sourcePort: FlowPort; targetPort: FlowPort };

function resolveContext(
  index: GraphIndex,
  attempt: ConnectionAttempt,
): ConnectionContext | { rejection: ConnectionRejection } {
  if (attempt.source === attempt.target) {
    return { rejection: { code: "SELF_CONNECTION" } };
  }

  const sourceNode = nodeOf(index, attempt.source);
  const targetNode = nodeOf(index, attempt.target);
  if (!sourceNode || !targetNode) {
    return { rejection: { code: "NODE_NOT_FOUND" } };
  }

  const sourcePort = findPort(sourceNode, attempt.sourceHandle);
  const targetPort = findPort(targetNode, attempt.targetHandle);
  if (!sourcePort || !targetPort) {
    return { rejection: { code: "PORT_NOT_FOUND" } };
  }
  if (sourcePort.direction !== "out" || targetPort.direction !== "in") {
    return { rejection: { code: "DIRECTION_MISMATCH" } };
  }

  return { sourcePort, targetPort };
}

function checkDomains(context: ConnectionContext): ConnectionRejection | null {
  const from = context.sourcePort.domain;
  const to = context.targetPort.domain;
  return canCarry(from, to) ? null : { code: "DOMAIN_MISMATCH", from, to };
}

function checkCapacity(
  index: GraphIndex,
  attempt: ConnectionAttempt,
  targetPort: FlowPort,
): ConnectionRejection | null {
  const existing = edgesIntoPort(index, attempt.target, attempt.targetHandle);

  const isDuplicate = existing.some(
    (edge) =>
      edge.source === attempt.source &&
      edge.sourceHandle === attempt.sourceHandle,
  );
  if (isDuplicate) return { code: "DUPLICATE_EDGE" };

  return existing.length >= targetPort.maxConnections
    ? { code: "PORT_BUSY" }
    : null;
}

function reject(rejection: ConnectionRejection): ConnectionCheck {
  return {
    ok: false,
    rejection,
    message: connectionRejectionMessage(rejection),
  };
}
