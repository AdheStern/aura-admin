// src/features/signal-flow/components/nodes/simulation-node.tsx — nodo `simulation`: no referencia
// catálogo (salvedad de la Sección 5.1: es el punto de entrada al recinto, no un aparato), así que
// no lleva CatalogItemSelect. Su única entrada admite cualquier número de parlantes.

import type { Node, NodeProps } from "@xyflow/react";
import { ChannelHandles } from "@/features/signal-flow/components/nodes/channel-handles";
import { useResolvedNode } from "@/features/signal-flow/components/nodes/node-hooks";
import { NodeShell } from "@/features/signal-flow/components/nodes/node-shell";
import { portsOf } from "@/features/signal-flow/model/node-ports";
import type { FlowNodeData } from "@/features/signal-flow/schemas/node-data";

type SimulationNodeData = Extract<FlowNodeData, { kind: "simulation" }>;

export function SimulationNode({
  id,
  data,
  selected,
}: NodeProps<Node<SimulationNodeData, "simulation">>) {
  const resolved = useResolvedNode(id, data);

  return (
    <NodeShell nodeId={id} label="Simulación" selected={selected}>
      <p className="text-[11px] text-muted-foreground">
        Punto de entrada al editor de recinto.
      </p>
      <ChannelHandles ports={portsOf(resolved)} />
    </NodeShell>
  );
}
