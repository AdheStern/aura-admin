// src/features/scenes/components/scene-list.tsx — la rejilla de escenas de un proyecto, con su
// buscador. El botón de crear vive aquí y no en la página porque cambia de sitio según el estado:
// junto al buscador cuando hay escenas, dentro del cartel de vacío cuando no hay ninguna.

"use client";

import { LayersIcon } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { ListSearch } from "@/components/list-search";
import { CreateSceneDialog } from "@/features/scenes/components/create-scene-dialog";
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
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? scenes.filter((scene) => scene.name.toLowerCase().includes(needle))
    : scenes;

  if (scenes.length === 0) {
    return (
      <EmptyState
        icon={LayersIcon}
        title="Este proyecto no tiene escenas"
        hint={
          canManage
            ? "Una escena es un montaje concreto: su sistema de sonido, su recinto y sus simulaciones."
            : "Quien administre el proyecto puede crear la primera."
        }
      >
        {canManage ? <CreateSceneDialog projectId={projectId} /> : null}
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <ListSearch
          value={query}
          onValueChange={setQuery}
          placeholder="Buscar escenas"
          className="w-full sm:max-w-xs"
        />
        {canManage ? (
          <div className="ml-auto shrink-0">
            <CreateSceneDialog projectId={projectId} />
          </div>
        ) : null}
      </div>

      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Ninguna escena coincide con «{query}».
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              projectId={projectId}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
