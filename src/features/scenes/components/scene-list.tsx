// src/features/scenes/components/scene-list.tsx

import { LayersIcon } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
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
      <EmptyState
        icon={LayersIcon}
        title="Este proyecto no tiene escenas"
        hint={
          canManage
            ? "Una escena es un montaje concreto: su sistema de sonido, su recinto y sus simulaciones. Crea la primera con el botón de arriba."
            : "Quien administre el proyecto puede crear la primera."
        }
      />
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
