// src/features/room-editor/components/room-editor-link.tsx — el botón "Editor 2D →" que la
// barra del flujo de señal muestra en su franja derecha. Vive en room-editor y no en signal-flow
// porque es a donde apunta, no de dónde sale — signal-flow solo decide CUÁNDO mostrarlo
// (sceneStatus !== "DRAFT", Sección 08: el botón se habilita en FLOW_READY).

"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RoomEditorLink({
  projectId,
  sceneId,
  enabled,
}: {
  projectId: string;
  sceneId: string;
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <span
        title="Completa el flujo de señal para pasar al editor 2D"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "opacity-50",
        )}
      >
        Editor 2D →
      </span>
    );
  }

  return (
    <Link
      href={`/projects/${projectId}/scenes/${sceneId}/room`}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      Editor 2D →
    </Link>
  );
}
