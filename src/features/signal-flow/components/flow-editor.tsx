// src/features/signal-flow/components/flow-editor.tsx — raíz cliente del editor. isValidConnection
// delega en canConnect (Tarea 1) a través del store: es el único punto donde React Flow toca la
// regla de conexión, así que el lienzo nunca deja dibujar lo que el dominio prohíbe (potencia sobre
// entrada de línea, etc.) — coherente con que la Server Action revalida igual del lado servidor.

"use client";

import "@xyflow/react/dist/style.css";

import {
  Background,
  type Connection,
  Controls,
  type NodeMouseHandler,
  ReactFlow,
  type Viewport,
} from "@xyflow/react";
import { FlowToolbar } from "@/features/signal-flow/components/flow-toolbar";
import { FLOW_NODE_TYPES } from "@/features/signal-flow/components/nodes/node-types";
import { SpecsPanel } from "@/features/signal-flow/components/specs-panel";
import { useAutosaveFlow } from "@/features/signal-flow/hooks/use-autosave-flow";
import type { FlowStoreInit } from "@/features/signal-flow/store/flow-store";
import {
  FlowStoreProvider,
  useFlowStore,
} from "@/features/signal-flow/store/flow-store-provider";

export function FlowEditor({ init }: { init: FlowStoreInit }) {
  return (
    <FlowStoreProvider init={init}>
      <div className="flex h-[80vh] min-h-[600px] flex-col rounded-lg border">
        <FlowToolbar />
        <div className="flex min-h-0 flex-1">
          <FlowCanvas />
          <SpecsPanel />
        </div>
      </div>
    </FlowStoreProvider>
  );
}

function FlowCanvas() {
  useAutosaveFlow();

  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const viewport = useFlowStore((state) => state.viewport);
  const canManage = useFlowStore((state) => state.canManage);
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const connect = useFlowStore((state) => state.connect);
  const isValidConnection = useFlowStore((state) => state.isValidConnection);
  const setViewport = useFlowStore((state) => state.setViewport);
  const selectNode = useFlowStore((state) => state.selectNode);

  const handleNodeClick: NodeMouseHandler = (_event, node) =>
    selectNode(node.id);
  const handleConnect = (connection: Connection) => connect(connection);
  const handleMoveEnd = (_event: unknown, nextViewport: Viewport) =>
    setViewport(nextViewport);

  return (
    <div className="min-w-0 flex-1">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={FLOW_NODE_TYPES}
        defaultViewport={viewport}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        isValidConnection={isValidConnection}
        onNodeClick={handleNodeClick}
        onPaneClick={() => selectNode(null)}
        onMoveEnd={handleMoveEnd}
        nodesDraggable={canManage}
        nodesConnectable={canManage}
        elementsSelectable={canManage}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
