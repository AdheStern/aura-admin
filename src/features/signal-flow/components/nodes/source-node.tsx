// src/features/signal-flow/components/nodes/source-node.tsx — nodo `source`: sin entrada, dos
// salidas fijas (acústica + línea/DI). No hay canales "según spec" aquí — sourcePorts() en
// model/node-ports.ts las devuelve siempre iguales, cualquiera sea la fuente elegida.

import type { Node, NodeProps } from "@xyflow/react";
import { CatalogItemSelect } from "@/features/signal-flow/components/nodes/catalog-item-select";
import { ChannelHandles } from "@/features/signal-flow/components/nodes/channel-handles";
import { useResolvedNode } from "@/features/signal-flow/components/nodes/node-hooks";
import { NodeShell } from "@/features/signal-flow/components/nodes/node-shell";
import { portsOf } from "@/features/signal-flow/model/node-ports";
import type { FlowNodeData } from "@/features/signal-flow/schemas/node-data";

type SourceNodeData = Extract<FlowNodeData, { kind: "source" }>;

export function SourceNode({
  id,
  data,
  selected,
}: NodeProps<Node<SourceNodeData, "source">>) {
  const resolved = useResolvedNode(id, data);

  return (
    <NodeShell nodeId={id} kind="source" selected={selected}>
      <CatalogItemSelect
        nodeId={id}
        kind="source"
        catalogItemId={data.catalogItemId}
        placeholder="Elegir fuente…"
      />
      <ChannelHandles ports={portsOf(resolved)} />
    </NodeShell>
  );
}
