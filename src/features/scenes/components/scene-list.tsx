// src/features/scenes/components/scene-list.tsx

import { SceneCard } from "@/features/scenes/components/scene-card";
import type { SceneListItem } from "@/features/scenes/types";

export function SceneList({
  scenes,
  projectId,
  canManage,
}: {
  scenes: SceneListItem[];
  projectId: string;
  canManage: boolean;
}) {
  if (scenes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay escenas en este proyecto.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {scenes.map((scene) => (
        <SceneCard
          key={scene.id}
          scene={scene}
          projectId={projectId}
          canManage={canManage}
        />
      ))}
    </div>
  );
}
