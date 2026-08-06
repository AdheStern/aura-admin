// src/features/signal-flow/components/nodes/microphone-node.tsx — nodo `microphone`: 1 entrada
// acústica, 1 salida de línea. Fijo también, como el de fuente — el spec solo aporta el datasheet.

import type { Node, NodeProps } from "@xyflow/react";
import { CatalogItemSelect } from "@/features/signal-flow/components/nodes/catalog-item-select";
import { ChannelHandles } from "@/features/signal-flow/components/nodes/channel-handles";
import { useResolvedNode } from "@/features/signal-flow/components/nodes/node-hooks";
import { NodeShell } from "@/features/signal-flow/components/nodes/node-shell";
import { portsOf } from "@/features/signal-flow/model/node-ports";
import type { FlowNodeData } from "@/features/signal-flow/schemas/node-data";

type MicrophoneNodeData = Extract<FlowNodeData, { kind: "microphone" }>;

export function MicrophoneNode({
  id,
  data,
  selected,
}: NodeProps<Node<MicrophoneNodeData, "microphone">>) {
  const resolved = useResolvedNode(id, data);

  return (
    <NodeShell nodeId={id} kind="microphone" selected={selected}>
      <CatalogItemSelect
        nodeId={id}
        kind="microphone"
        catalogItemId={data.catalogItemId}
        placeholder="Elegir micrófono…"
      />
      <ChannelHandles ports={portsOf(resolved)} />
    </NodeShell>
  );
}
