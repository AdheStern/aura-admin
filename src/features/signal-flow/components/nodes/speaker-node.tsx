// src/features/signal-flow/components/nodes/speaker-node.tsx — nodo `speaker`: 1 entrada (línea si
// es activa, potencia si es pasiva) + salida de enlace + salida hacia la simulación. Los tres
// ajustes de escena (nivel, polaridad, delay) NO se editan aquí — decisión tomada con el usuario:
// van en el panel lateral al seleccionar el nodo, para no recargar un cuerpo ya angosto.

import type { Node, NodeProps } from "@xyflow/react";
import { CatalogItemSelect } from "@/features/signal-flow/components/nodes/catalog-item-select";
import { ChannelHandles } from "@/features/signal-flow/components/nodes/channel-handles";
import { useResolvedNode } from "@/features/signal-flow/components/nodes/node-hooks";
import { NodeShell } from "@/features/signal-flow/components/nodes/node-shell";
import { portsOf } from "@/features/signal-flow/model/node-ports";
import type { FlowNodeData } from "@/features/signal-flow/schemas/node-data";

type SpeakerNodeData = Extract<FlowNodeData, { kind: "speaker" }>;

export function SpeakerNode({
  id,
  data,
  selected,
}: NodeProps<Node<SpeakerNodeData, "speaker">>) {
  const resolved = useResolvedNode(id, data);

  return (
    <NodeShell nodeId={id} label="Parlante" selected={selected}>
      <CatalogItemSelect
        nodeId={id}
        kind="speaker"
        catalogItemId={data.catalogItemId}
        placeholder="Elegir parlante…"
      />
      <ChannelHandles ports={portsOf(resolved)} />
    </NodeShell>
  );
}
