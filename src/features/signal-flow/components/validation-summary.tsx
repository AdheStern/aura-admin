// src/features/signal-flow/components/validation-summary.tsx — el veredicto del validador (Tarea
// 1), listado y accionable: cada issue con nodeId salta a ese nodo al hacer click, así arreglar el
// grafo no requiere leer el código de error e ir a buscarlo a mano por el lienzo.

"use client";

import { useFlowStore } from "@/features/signal-flow/store/flow-store-provider";
import type { FlowIssue } from "@/features/signal-flow/validation/issue-codes";
import { cn } from "@/lib/utils";

export function ValidationSummary() {
  const validation = useFlowStore((state) => state.validation);
  const selectNode = useFlowStore((state) => state.selectNode);

  if (validation.errors.length === 0 && validation.warnings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sistema completo: sin errores ni avisos.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <IssueGroup
        title="Errores"
        tone="error"
        issues={validation.errors}
        onSelect={selectNode}
      />
      <IssueGroup
        title="Avisos"
        tone="warning"
        issues={validation.warnings}
        onSelect={selectNode}
      />
    </div>
  );
}

function IssueGroup({
  title,
  tone,
  issues,
  onSelect,
}: {
  title: string;
  tone: "error" | "warning";
  issues: FlowIssue[];
  onSelect: (nodeId: string) => void;
}) {
  if (issues.length === 0) return null;

  return (
    <div>
      <h3
        className={cn(
          "mb-1 text-xs font-semibold uppercase",
          tone === "error" ? "text-destructive" : "text-amber-600",
        )}
      >
        {title} ({issues.length})
      </h3>
      <ul className="flex flex-col gap-1">
        {issues.map((issue, index) => (
          <li key={`${issue.code}-${issue.nodeId ?? issue.edgeId ?? index}`}>
            <button
              type="button"
              disabled={!issue.nodeId}
              onClick={() => issue.nodeId && onSelect(issue.nodeId)}
              className="text-left text-xs text-foreground hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
            >
              {issue.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
