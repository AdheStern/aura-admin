// src/features/signal-flow/components/flow-editor.tsx — raíz cliente del editor. isValidConnection
// delega en canConnect (Tarea 1) a través del store: es el único punto donde React Flow toca la
// regla de conexión, así que el lienzo nunca deja dibujar lo que el dominio prohíbe (potencia sobre
// entrada de línea, etc.) — coherente con que la Server Action revalida igual del lado servidor.

"use client";

import "@xyflow/react/dist/style.css";

import {
  Background,
  type ColorMode,
  type Connection,
  Controls,
  type NodeMouseHandler,
  ReactFlow,
  type Viewport,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FlowToolbar } from "@/features/signal-flow/components/flow-toolbar";
import { FLOW_NODE_TYPES } from "@/features/signal-flow/components/nodes/node-types";
import { SpecsPanel } from "@/features/signal-flow/components/specs-panel";
import { useAutosaveFlow } from "@/features/signal-flow/hooks/use-autosave-flow";
import type { FlowStoreInit } from "@/features/signal-flow/store/flow-store";
import {
  FlowStoreProvider,
  useFlowStore,
} from "@/features/signal-flow/store/flow-store-provider";

export function FlowEditor({
  init,
  sceneName,
}: {
  init: FlowStoreInit;
  sceneName: string;
}) {
  return (
    <FlowStoreProvider init={init}>
      <div className="flex h-full min-h-0 flex-col">
        <FlowToolbar sceneName={sceneName} />
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

  // React Flow trae su propio tema y por defecto se queda en claro: sin atarlo al de la app, sus
  // controles y aristas se quedarían en colores de tema claro sobre un fondo oscuro.
  //
  // El tema NO se puede leer mientras se renderiza en el servidor: next-themes lo saca de
  // localStorage, así que allí vale undefined mientras que en el primer render del cliente ya vale
  // "dark". React Flow escribe ese valor en la clase de su envoltorio (`react-flow dark`), que es
  // DOM hidratado, y esa diferencia rompía la hidratación del árbol entero. Con el guardia los dos
  // lados pintan "light" y el tema real entra al montar — mismo idioma que theme-toggle.tsx.
  // Los lienzos 2D y 3D no lo necesitan: dibujan con Konva y three, que no hidratan nada.
  const { resolvedTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  const colorMode: ColorMode =
    isMounted && resolvedTheme === "dark" ? "dark" : "light";

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
        colorMode={colorMode}
        defaultViewport={viewport}
        // Backspace es el único atajo de borrado que trae React Flow; en Windows la tecla que la
        // gente usa es Supr, y sin esto no pasaba nada al pulsarla.
        deleteKeyCode={["Backspace", "Delete"]}
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
