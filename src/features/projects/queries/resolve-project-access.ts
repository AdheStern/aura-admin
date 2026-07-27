// src/features/projects/queries/resolve-project-access.ts — único punto de entrada de
// autorización de proyectos (Sección 4.0). Un solo proyecto a la vez; para listados ver
// list-projects-for-user.ts (misma tabla de precedencia, sin N+1).

import { deriveProjectRole } from "@/features/projects/queries/derive-project-role";
import type { ProjectRole } from "@/features/projects/schemas/roles";
import { db } from "@/lib/db";

export type ProjectAccess = { role: ProjectRole };

export async function resolveProjectAccess(
  userId: string,
  projectId: string,
): Promise<ProjectAccess | null> {
  const [project, user] = await Promise.all([
    db.project.findUnique({
      where: { id: projectId },
      select: {
        ownerId: true,
        members: { where: { userId }, select: { role: true }, take: 1 },
        organization: {
          select: {
            members: { where: { userId }, select: { role: true }, take: 1 },
          },
        },
      },
    }),
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ]);

  if (!project) return null;

  const role = deriveProjectRole({
    platformRole: user?.role ?? null,
    isOwner: project.ownerId === userId,
    memberRole: project.members[0]?.role ?? null,
    orgRole: project.organization?.members[0]?.role ?? null,
  });

  return role ? { role } : null;
}
