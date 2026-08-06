// src/features/signal-flow/components/nodes/node-shell.tsx — envoltorio visual común a los seis
// tipos. Reparte dos señales por canales distintos para que nunca compitan: el BORDE es la
// severidad de validación (rojo si hay error, ámbar si solo avisos) y la FRANJA superior es el
// tipo de nodo. Si ambas usaran el borde, un nodo con error perdería su identidad justo cuando más
// falta hace saber qué es.

"use client";

import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useNodeIssues } from "@/features/signal-flow/components/nodes/node-hooks";
import { flowNodeDefinition } from "@/features/signal-flow/model/node-registry";
import type { FlowNodeKind } from "@/features/signal-flow/schemas/node-kinds";
import { useFlowStore } from "@/features/signal-flow/store/flow-store-provider";
import { cn } from "@/lib/utils";

type Severity = "error" | "warning" | "ok";

const BORDER_BY_SEVERITY: Record<Severity, string> = {
  error: "border-destructive",
  warning: "border-amber-500",
  ok: "border-border",
};

export function NodeShell({
  nodeId,
  kind,
  selected,
  children,
}: {
  nodeId: string;
  kind: FlowNodeKind;
  selected: boolean;
  children: ReactNode;
}) {
  const { errors, warnings } = useNodeIssues(nodeId);
  const canManage = useFlowStore((state) => state.canManage);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const definition = flowNodeDefinition(kind);

  const severity: Severity =
    errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "ok";

  return (
    <div
      className={cn(
        "w-56 overflow-hidden rounded-lg border-2 bg-card shadow-sm",
        BORDER_BY_SEVERITY[severity],
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
      )}
    >
      <div className={cn("h-1.5 w-full", definition.accentClass)} />
      <div className="p-2">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
            {definition.label}
          </span>
          {severity === "ok" ? null : (
            <span
              title={
                severity === "error"
                  ? `${errors.length} error(es)`
                  : `${warnings.length} aviso(s)`
              }
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                severity === "error" ? "bg-destructive" : "bg-amber-500",
              )}
            />
          )}
          {canManage ? (
            // nodrag: sin esa clase el mousedown sobre el botón lo interpreta React Flow como el
            // inicio de un arrastre del nodo y el click nunca llega.
            <button
              type="button"
              aria-label="Eliminar nodo"
              title="Eliminar nodo"
              onClick={() => deleteNode(nodeId)}
              className="nodrag -mr-0.5 shrink-0 rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <XIcon className="size-3" />
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}
