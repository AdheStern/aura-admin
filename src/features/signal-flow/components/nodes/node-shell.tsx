// src/features/signal-flow/components/nodes/node-shell.tsx — envoltorio visual común a los seis
// tipos. El "estado de error visual" de la tarea vive aquí y solo aquí: el borde se pinta según la
// severidad más alta que el validador le asignó a este nodo, así que un nodo nunca puede verse
// "bien" mientras tiene un error real pendiente.

"use client";

import type { ReactNode } from "react";
import { useNodeIssues } from "@/features/signal-flow/components/nodes/node-hooks";
import { cn } from "@/lib/utils";

type Severity = "error" | "warning" | "ok";

const BORDER_BY_SEVERITY: Record<Severity, string> = {
  error: "border-destructive",
  warning: "border-amber-500",
  ok: "border-border",
};

export function NodeShell({
  nodeId,
  label,
  selected,
  children,
}: {
  nodeId: string;
  label: string;
  selected: boolean;
  children: ReactNode;
}) {
  const { errors, warnings } = useNodeIssues(nodeId);
  const severity: Severity =
    errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "ok";

  return (
    <div
      className={cn(
        "w-56 rounded-lg border-2 bg-card p-2 shadow-sm",
        BORDER_BY_SEVERITY[severity],
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-foreground">{label}</span>
        {severity !== "ok" ? (
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
        ) : null}
      </div>
      {children}
    </div>
  );
}
