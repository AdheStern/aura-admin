// src/features/scenes/components/scene-card.tsx

import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteSceneAlert } from "@/features/scenes/components/delete-scene-alert";
import { RenameSceneDialog } from "@/features/scenes/components/rename-scene-dialog";
import { SceneStatusBadge } from "@/features/scenes/components/scene-status-badge";
import type { SceneListItem } from "@/features/scenes/types";

export function SceneCard({
  scene,
  canManage,
}: {
  scene: SceneListItem;
  canManage: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="truncate">{scene.name}</span>
          <SceneStatusBadge status={scene.status} />
        </CardTitle>
      </CardHeader>
      {canManage ? (
        <CardFooter className="gap-2">
          <RenameSceneDialog sceneId={scene.id} name={scene.name} />
          <DeleteSceneAlert sceneId={scene.id} sceneName={scene.name} />
        </CardFooter>
      ) : null}
    </Card>
  );
}
