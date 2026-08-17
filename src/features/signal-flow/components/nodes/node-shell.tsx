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
      {/* Cabecera teñida con el color del tipo, con su icono: se reconoce de qué es el nodo de un
          vistazo y sin leer, que es lo que hace legible un lienzo con quince cajas. */}
      <div
        className={cn(
          "flex items-center gap-1.5 border-b px-2 py-1.5",
          definition.accentClass,
          definition.accentTextClass,
        )}
      >
        <definition.icon className="size-3.5 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold">
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
            className="nodrag -mr-0.5 shrink-0 rounded p-0.5 opacity-60 hover:bg-destructive/10 hover:text-destructive hover:opacity-100"
          >
            <XIcon className="size-3" />
          </button>
        ) : null}
      </div>

      <div className="p-2">{children}</div>
    </div>
  );
}
