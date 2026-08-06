// src/features/signal-flow/components/nodes/node-types.ts — registro de los seis componentes de
// nodo para la prop `nodeTypes` de <ReactFlow>. Espejo de node-registry.ts del dominio (mismo
// espíritu Factory + Registry, Sección 9.1), pero del lado de React Flow: uno es dominio puro y
// el otro es UI, así que no se fusionan aunque enumeren los mismos seis kinds.

import type { NodeTypes } from "@xyflow/react";
import { ConsoleNode } from "@/features/signal-flow/components/nodes/console-node";
import { MicrophoneNode } from "@/features/signal-flow/components/nodes/microphone-node";
import { PaNode } from "@/features/signal-flow/components/nodes/pa-node";
import { SimulationNode } from "@/features/signal-flow/components/nodes/simulation-node";
import { SourceNode } from "@/features/signal-flow/components/nodes/source-node";
import { SpeakerNode } from "@/features/signal-flow/components/nodes/speaker-node";

export const FLOW_NODE_TYPES: NodeTypes = {
  source: SourceNode,
  microphone: MicrophoneNode,
  console: ConsoleNode,
  pa: PaNode,
  speaker: SpeakerNode,
  simulation: SimulationNode,
};
