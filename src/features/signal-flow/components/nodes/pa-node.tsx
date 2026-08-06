// src/features/signal-flow/components/nodes/pa-node.tsx — nodo `pa`: procesador o amplificador
// (unión discriminada en AmplifierSpec). El nodo se dibuja igual en los dos casos; lo que cambia es
// el dominio de sus salidas, y eso lo decide portsOf() a partir de spec.kind — no hay una rama
// visual aquí para "processor" vs "amplifier", la diferencia ya la carga el color/dominio de los
// handles que ChannelHandles pinta.

import type { Node, NodeProps } from "@xyflow/react";
import { CatalogItemSelect } from "@/features/signal-flow/components/nodes/catalog-item-select";
import { ChannelHandles } from "@/features/signal-flow/components/nodes/channel-handles";
import { useResolvedNode } from "@/features/signal-flow/components/nodes/node-hooks";
import { NodeShell } from "@/features/signal-flow/components/nodes/node-shell";
import { portsOf } from "@/features/signal-flow/model/node-ports";
import type { FlowNodeData } from "@/features/signal-flow/schemas/node-data";

type PaNodeData = Extract<FlowNodeData, { kind: "pa" }>;

export function PaNode({
  id,
  data,
  selected,
}: NodeProps<Node<PaNodeData, "pa">>) {
  const resolved = useResolvedNode(id, data);

  return (
    <NodeShell nodeId={id} label="Amplificador / PA" selected={selected}>
      <CatalogItemSelect
        nodeId={id}
        kind="pa"
        catalogItemId={data.catalogItemId}
        placeholder="Elegir amplificador o procesador…"
      />
      <ChannelHandles ports={portsOf(resolved)} />
    </NodeShell>
  );
}
