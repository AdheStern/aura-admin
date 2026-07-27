// src/features/scenes/queries.ts — lectura compuesta: solo se llama después de que la página ya
// resolvió acceso vía getProjectWithRole(). No revalida authz aquí — las actions de escena SÍ
// lo hacen siempre por su cuenta (una Server Action es un endpoint invocable directo).

import type { SceneStatus } from "@/features/scenes/schemas";
import type { SceneListItem } from "@/features/scenes/types";
import { db } from "@/lib/db";

export async function listScenesForProject(
  projectId: string,
): Promise<SceneListItem[]> {
  const scenes = await db.scene.findMany({
    where: { projectId },
    select: { id: true, name: true, status: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return scenes.map((scene) => ({
    id: scene.id,
    name: scene.name,
    status: scene.status as SceneStatus,
    updatedAt: scene.updatedAt,
  }));
}
