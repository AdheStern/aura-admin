// src/features/signal-flow/components/nodes/console-node.tsx — nodo `console`: N entradas → M
// buses, según spec.io. Una consola de 32 canales dibuja 32 handles reales en ChannelHandles (con
// scroll) — no una tira agregada: el modelo ya resuelve cada canal por índice.

import type { Node, NodeProps } from "@xyflow/react";
import { CatalogItemSelect } from "@/features/signal-flow/components/nodes/catalog-item-select";
import { ChannelHandles } from "@/features/signal-flow/components/nodes/channel-handles";
import { useResolvedNode } from "@/features/signal-flow/components/nodes/node-hooks";
import { NodeShell } from "@/features/signal-flow/components/nodes/node-shell";
import { portsOf } from "@/features/signal-flow/model/node-ports";
import type { FlowNodeData } from "@/features/signal-flow/schemas/node-data";

type ConsoleNodeData = Extract<FlowNodeData, { kind: "console" }>;

export function ConsoleNode({
  id,
  data,
  selected,
}: NodeProps<Node<ConsoleNodeData, "console">>) {
  const resolved = useResolvedNode(id, data);

  return (
    <NodeShell nodeId={id} kind="console" selected={selected}>
      <CatalogItemSelect
        nodeId={id}
        kind="console"
        catalogItemId={data.catalogItemId}
        placeholder="Elegir consola…"
      />
      <ChannelHandles ports={portsOf(resolved)} />
    </NodeShell>
  );
}
