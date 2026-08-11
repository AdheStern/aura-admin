// src/features/room-editor/components/room-validation-summary.tsx — el veredicto del validador
// geométrico (Tarea 1), listado y accionable. Calcado de signal-flow/validation-summary.tsx: cada
// aviso selecciona su figura al hacer click, vía selectionFromIssueTarget.

"use client";

import {
  type RoomSelection,
  selectionFromIssueTarget,
} from "@/features/room-editor/store/room-selection";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";
import type { RoomIssue } from "@/features/room-editor/validation/issue-codes";
import { cn } from "@/lib/utils";

export function RoomValidationSummary() {
  const validation = useRoomStore((state) => state.validation);
  const select = useRoomStore((state) => state.select);

  if (validation.errors.length === 0 && validation.warnings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Recinto completo: sin errores ni avisos.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <IssueGroup
        title="Errores"
        tone="error"
        issues={validation.errors}
        onSelect={select}
      />
      <IssueGroup
        title="Avisos"
        tone="warning"
        issues={validation.warnings}
        onSelect={select}
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
  issues: RoomIssue[];
  onSelect: (selection: RoomSelection | null) => void;
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
        {issues.map((issue, index) => {
          const selection = selectionFromIssueTarget(issue.target);
          return (
            <li key={`${issue.code}-${index}`}>
              <button
                type="button"
                disabled={!selection}
                onClick={() => selection && onSelect(selection)}
                className="text-left text-xs text-foreground hover:underline disabled:cursor-default disabled:text-muted-foreground disabled:no-underline"
              >
                {issue.message}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
