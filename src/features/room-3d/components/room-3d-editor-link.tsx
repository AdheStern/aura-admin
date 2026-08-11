// src/features/room-3d/components/room-3d-editor-link.tsx — el botón "Generar 3D →" que la barra
// del editor 2D muestra en su franja derecha. Vive en room-3d y no en room-editor por el mismo
// motivo que room-editor-link.tsx vive en room-editor: apunta hacia acá, no sale de acá —
// room-editor solo decide CUÁNDO mostrarlo (§08: "Generar 3D" se habilita en geometría válida, que
// es justo lo que marca el estado ROOM_READY).

"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Room3dEditorLink({
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
        title="Completa el recinto (geometría, materiales y audiencia) para pasar al editor 3D"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "opacity-50",
        )}
      >
        Generar 3D →
      </span>
    );
  }

  return (
    <Link
      href={`/projects/${projectId}/scenes/${sceneId}/room/3d`}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      Generar 3D →
    </Link>
  );
}
