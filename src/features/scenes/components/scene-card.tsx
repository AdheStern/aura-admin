// src/features/scenes/components/scene-card.tsx — una tarjeta de la rejilla de escenas.
//
// Las acciones van en el pie, FUERA del enlace: renombrar y eliminar viven en la misma tarjeta, y
// si el enlace la cubriera entera cada clic en ellas navegaría antes de abrir el diálogo.

import { LayersIcon } from "lucide-react";
import Link from "next/link";
import { Card, CardFooter } from "@/components/ui/card";
import { DeleteSceneAlert } from "@/features/scenes/components/delete-scene-alert";
import { RenameSceneDialog } from "@/features/scenes/components/rename-scene-dialog";
import { SceneStatusBadge } from "@/features/scenes/components/scene-status-badge";
import type { SceneListItem } from "@/features/scenes/types";

export function SceneCard({
  scene,
  projectId,
  canManage,
}: {
  scene: SceneListItem;
  projectId: string;
  canManage: boolean;
}) {
  return (
    // El anillo de foco se pinta en la tarjeta y no en el enlace porque `Card` recorta lo que se
    // sale (`overflow-hidden`): dentro, el anillo del enlace quedaría cortado por los cuatro lados.
    <Card className="gap-0 p-0 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50">
      <Link
        href={`/projects/${projectId}/scenes/${scene.id}/flow`}
        className="flex flex-1 flex-col gap-3 p-4 outline-none transition-colors hover:bg-accent/50"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <LayersIcon className="size-5" aria-hidden />
          </div>
          <SceneStatusBadge status={scene.status} />
        </div>
        <h3 className="truncate font-medium">{scene.name}</h3>
      </Link>

      {canManage ? (
        <CardFooter className="gap-1 p-2">
          <RenameSceneDialog sceneId={scene.id} name={scene.name} />
          <DeleteSceneAlert sceneId={scene.id} sceneName={scene.name} />
        </CardFooter>
      ) : null}
    </Card>
  );
}
