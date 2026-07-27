// src/features/projects/queries/list-projects-for-user.ts — listado para /projects.
// No llama a resolveProjectAccess por fila (evitaría N+1): una sola query trae todo lo
// necesario y aplica la misma deriveProjectRole() en memoria.
//
// Decisión: SUPER_ADMIN no ve aquí "todos los proyectos del sistema", solo los propios/
// compartidos — su acceso total (Sección 4.0) se resuelve al abrir un proyecto puntual vía
// resolveProjectAccess, no inflando este listado. Una vista de administración global es una
// feature aparte, no pedida en esta tarea.

import { deriveProjectRole } from "@/features/projects/queries/derive-project-role";
import type { ProjectListItem } from "@/features/projects/types";
import { db } from "@/lib/db";

export async function listProjectsForUser(
  userId: string,
): Promise<ProjectListItem[]> {
  const [rows, user] = await Promise.all([
    db.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
          { organization: { members: { some: { userId } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        description: true,
        ownerId: true,
        updatedAt: true,
        owner: { select: { name: true } },
        members: { where: { userId }, select: { role: true }, take: 1 },
        organization: {
          select: {
            members: { where: { userId }, select: { role: true }, take: 1 },
          },
        },
        _count: { select: { scenes: true, members: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    db.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ]);

  const items: ProjectListItem[] = [];
  for (const project of rows) {
    const role = deriveProjectRole({
      platformRole: user?.role ?? null,
      isOwner: project.ownerId === userId,
      memberRole: project.members[0]?.role ?? null,
      orgRole: project.organization?.members[0]?.role ?? null,
    });
    if (!role) continue;
    items.push({
      id: project.id,
      name: project.name,
      description: project.description,
      role,
      ownerId: project.ownerId,
      ownerName: project.owner.name,
      sceneCount: project._count.scenes,
      memberCount: project._count.members,
      updatedAt: project.updatedAt,
    });
  }
  return items;
}
