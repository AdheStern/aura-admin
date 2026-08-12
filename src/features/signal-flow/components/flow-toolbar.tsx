// src/features/signal-flow/components/flow-toolbar.tsx — un botón "+ nodo" por tipo del registro
// del dominio (respeta maxPerScene: "+ Simulación" se apaga sola en cuanto ya hay una), y el estado
// de guardado. El badge de escena refleja el status que devolvió el ÚLTIMO GUARDADO autoritativo,
// no un cálculo local — el store solo lo actualiza desde applySaveResult (ver flow-store.ts).

"use client";

import { PlusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RoomEditorLink } from "@/features/room-editor/components/room-editor-link";
import { SceneEditorHeader } from "@/features/scenes/components/scene-editor-header";
import { SceneStatusBadge } from "@/features/scenes/components/scene-status-badge";
import { FLOW_NODE_DEFINITIONS } from "@/features/signal-flow/model/node-registry";
import type { FlowNodeKind } from "@/features/signal-flow/schemas/node-kinds";
import type { SaveStatus } from "@/features/signal-flow/store/flow-store";
import { useFlowStore } from "@/features/signal-flow/store/flow-store-provider";
import { cn } from "@/lib/utils";

const ADD_ORDER: FlowNodeKind[] = [
  "source",
  "microphone",
  "console",
  "pa",
  "speaker",
  "simulation",
];

export function FlowToolbar({ sceneName }: { sceneName: string }) {
  const params = useParams<{ projectId: string; sceneId: string }>();
  const nodes = useFlowStore((state) => state.nodes);
  const addNode = useFlowStore((state) => state.addNode);
  const canManage = useFlowStore((state) => state.canManage);
  const sceneStatus = useFlowStore((state) => state.sceneStatus);
  const saveStatus = useFlowStore((state) => state.saveStatus);

  function handleAdd(kind: FlowNodeKind) {
    // Grilla simple para que los nodos nuevos no se solapen. El paso vertical tiene que superar el
    // alto del nodo MÁS ALTO posible: una consola de 18 canales llega al tope de la tira scrollable
    // (max-h-36) y ronda los 210 px, así que con menos de eso los nodos de la fila siguiente se
    // montan encima e interceptan los clicks de los de arriba.
    const index = nodes.length;
    const columns = 4;
    addNode(kind, {
      x: 60 + (index % columns) * 260,
      y: 60 + Math.floor(index / columns) * 280,
    });
  }

  return (
    <>
      <SceneEditorHeader
        sceneName={sceneName}
        meta={`${nodes.length} ${nodes.length === 1 ? "nodo" : "nodos"}`}
      >
        <SaveStatusLabel status={saveStatus} />
        <SceneStatusBadge status={sceneStatus} />
        <RoomEditorLink
          projectId={params.projectId}
          sceneId={params.sceneId}
          enabled={sceneStatus !== "DRAFT"}
        />
      </SceneEditorHeader>

      {/* La paleta va en su propia fila: son las herramientas del lienzo, no acciones de la escena,
          y mezclarlas con el título dejaría una franja que crece cada vez que se añade un tipo. */}
      {canManage ? (
        <div className="flex flex-wrap items-center gap-2 border-b bg-background px-4 py-2">
          {ADD_ORDER.map((kind) => {
            const definition = FLOW_NODE_DEFINITIONS[kind];
            const countOfKind = nodes.filter(
              (node) => node.data.kind === kind,
            ).length;
            return (
              <Button
                key={kind}
                variant="outline"
                size="sm"
                disabled={countOfKind >= definition.maxPerScene}
                onClick={() => handleAdd(kind)}
              >
                <PlusIcon /> {definition.label}
              </Button>
            );
          })}
        </div>
      ) : null}
    </>
  );
}

const SAVE_STATUS_LABEL: Record<SaveStatus, string> = {
  idle: "",
  saving: "Guardando…",
  saved: "Guardado",
  error: "Error al guardar",
};

function SaveStatusLabel({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  return (
    <span
      className={cn(
        "text-xs",
        status === "error" ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {SAVE_STATUS_LABEL[status]}
    </span>
  );
}
