// src/features/signal-flow/__tests__/fixtures/flow-builder.ts — armado de grafos para los tests.
// Construyen el ResolvedFlow directamente, saltándose Prisma: las reglas son puras y probarlas
// contra una base de datos solo añadiría lentitud y una fuente de fallos ajena a lo que se mide.

import type { AmplifierSpec } from "@/contracts/amplifier-spec.schema";
import type { ConsoleSpec } from "@/contracts/console-spec.schema";
import type { MicrophoneSpec } from "@/contracts/microphone-spec.schema";
import type { SourceSpec } from "@/contracts/source-spec.schema";
import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";
import {
  consoleSpec,
  microphoneSpec,
  sourceSpec,
  speakerSpec,
} from "@/features/signal-flow/__tests__/fixtures/specs";
import type {
  ResolvedFlow,
  ResolvedNode,
  SpecStatus,
} from "@/features/signal-flow/model/resolved-flow";
import type { SourceOutputMode } from "@/features/signal-flow/schemas/node-data";
import type { FlowNodeKind } from "@/features/signal-flow/schemas/node-kinds";
import type { FlowEdge } from "@/features/signal-flow/schemas/signal-flow";

const AT = { x: 0, y: 0 };

export function sourceNode(
  id: string,
  spec: SourceSpec = sourceSpec(),
  outputMode: SourceOutputMode = "mono",
): ResolvedNode {
  return {
    id,
    position: AT,
    kind: "source",
    data: { kind: "source", catalogItemId: `cat-${id}`, outputMode },
    specStatus: "resolved",
    spec,
  };
}

export function microphoneNode(
  id: string,
  spec: MicrophoneSpec = microphoneSpec(),
): ResolvedNode {
  return {
    id,
    position: AT,
    kind: "microphone",
    data: { kind: "microphone", catalogItemId: `cat-${id}` },
    specStatus: "resolved",
    spec,
  };
}

export function consoleNode(
  id: string,
  spec: ConsoleSpec = consoleSpec(),
): ResolvedNode {
  return {
    id,
    position: AT,
    kind: "console",
    data: { kind: "console", catalogItemId: `cat-${id}` },
    specStatus: "resolved",
    spec,
  };
}

export function paNode(id: string, spec: AmplifierSpec): ResolvedNode {
  return {
    id,
    position: AT,
    kind: "pa",
    data: { kind: "pa", catalogItemId: `cat-${id}` },
    specStatus: "resolved",
    spec,
  };
}

export function speakerNode(
  id: string,
  spec: SpeakerSpec = speakerSpec({ activePowered: false }),
): ResolvedNode {
  return {
    id,
    position: AT,
    kind: "speaker",
    data: {
      kind: "speaker",
      catalogItemId: `cat-${id}`,
      levelDb: 0,
      polarityInverted: false,
      delayMs: 0,
    },
    specStatus: "resolved",
    spec,
  };
}

export function simulationNode(id = "sim"): ResolvedNode {
  return {
    id,
    position: AT,
    kind: "simulation",
    data: { kind: "simulation" },
    specStatus: "not_applicable",
    spec: null,
  };
}

/** Nodo cuyo ítem de catálogo no se pudo resolver (borrado, sin elegir, versión desconocida). */
export function brokenNode(
  kind: Exclude<FlowNodeKind, "simulation">,
  id: string,
  specStatus: SpecStatus,
): ResolvedNode {
  return {
    id,
    position: AT,
    kind,
    data: {
      kind,
      catalogItemId: specStatus === "not_selected" ? null : `cat-${id}`,
      ...(kind === "speaker"
        ? { levelDb: 0, polarityInverted: false, delayMs: 0 }
        : {}),
      ...(kind === "source" ? { outputMode: "mono" } : {}),
    },
    specStatus,
    spec: null,
  } as ResolvedNode;
}

export function edge(
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
): FlowEdge {
  return {
    id: `${source}.${sourceHandle}->${target}.${targetHandle}`,
    source,
    sourceHandle,
    target,
    targetHandle,
  };
}

export function flow(
  nodes: readonly ResolvedNode[],
  edges: readonly FlowEdge[] = [],
): ResolvedFlow {
  return { nodes, edges };
}
