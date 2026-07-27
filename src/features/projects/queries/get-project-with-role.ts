// src/features/projects/queries/get-project-with-role.ts — proyecto + rol resuelto, para la
// página de detalle. null → la página hace notFound() (no revela existencia sin acceso).

import { resolveProjectAccess } from "@/features/projects/queries/resolve-project-access";
import type { ProjectRole } from "@/features/projects/schemas/roles";
import type { ProjectWithRole } from "@/features/projects/types";
import { db } from "@/lib/db";

export async function getProjectWithRole(
  userId: string,
  projectId: string,
): Promise<ProjectWithRole | null> {
  const access = await resolveProjectAccess(userId, projectId);
  if (!access) return null;

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      ownerId: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { name: true } },
      members: {
        select: {
          userId: true,
          role: true,
          user: { select: { name: true, email: true } },
        },
      },
      _count: { select: { scenes: true } },
    },
  });
  if (!project) return null;

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    role: access.role,
    ownerId: project.ownerId,
    ownerName: project.owner.name,
    members: project.members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role as ProjectRole,
    })),
    sceneCount: project._count.scenes,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}
