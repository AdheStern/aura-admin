// src/features/signal-flow/components/flow-toolbar.tsx — un botón "+ nodo" por tipo del registro
// del dominio (respeta maxPerScene: "+ Simulación" se apaga sola en cuanto ya hay una), y el estado
// de guardado. El badge de escena refleja el status que devolvió el ÚLTIMO GUARDADO autoritativo,
// no un cálculo local — el store solo lo actualiza desde applySaveResult (ver flow-store.ts).

"use client";

import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function FlowToolbar() {
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
    <div className="flex flex-wrap items-center gap-2 border-b bg-background p-2">
      {canManage
        ? ADD_ORDER.map((kind) => {
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
          })
        : null}
      <div className="ml-auto flex items-center gap-3">
        <SaveStatusLabel status={saveStatus} />
        <SceneStatusBadge status={sceneStatus} />
      </div>
    </div>
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
