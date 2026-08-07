// src/features/room-editor/components/save-status-label.tsx — indicador de autosave, compartido
// por el toolbar del editor 2D y el del 3D (Fase 4): ambos escriben al mismo documento por el
// mismo saveRoom, así que el estado de guardado se lee y se muestra igual en los dos.

"use client";

import type { SaveStatus } from "@/features/room-editor/store/room-store";
import { cn } from "@/lib/utils";

const SAVE_STATUS_LABEL: Record<SaveStatus, string> = {
  idle: "",
  saving: "Guardando…",
  saved: "Guardado",
  error: "Error al guardar",
};

export function SaveStatusLabel({ status }: { status: SaveStatus }) {
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
