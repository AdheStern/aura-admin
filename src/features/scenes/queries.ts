// src/features/scenes/queries.ts — lectura compuesta: listScenesForProject solo se llama después
// de que la página ya resolvió acceso vía getProjectWithRole(). getSceneWithRole resuelve su propio
// acceso porque la página de una escena individual no pasa antes por la de su proyecto. Ninguna
// revalida authz para las actions — esas SIEMPRE lo hacen por su cuenta (una Server Action es un
// endpoint invocable directo).

import { resolveProjectAccess } from "@/features/projects/queries/resolve-project-access";
import type { ProjectRole } from "@/features/projects/schemas/roles";
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

export type SceneWithRole = {
  id: string;
  projectId: string;
  name: string;
  status: SceneStatus;
  signalFlow: unknown;
  role: ProjectRole;
};

/** null → sin acceso (o escena inexistente): la página hace notFound() en ambos casos. */
export async function getSceneWithRole(
  userId: string,
  sceneId: string,
): Promise<SceneWithRole | null> {
  const scene = await db.scene.findUnique({
    where: { id: sceneId },
    select: {
      id: true,
      projectId: true,
      name: true,
      status: true,
      signalFlow: true,
    },
  });
  if (!scene) return null;

  const access = await resolveProjectAccess(userId, scene.projectId);
  if (!access) return null;

  return {
    id: scene.id,
    projectId: scene.projectId,
    name: scene.name,
    status: scene.status as SceneStatus,
    signalFlow: scene.signalFlow,
    role: access.role,
  };
}
