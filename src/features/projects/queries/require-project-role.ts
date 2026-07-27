// src/features/projects/queries/require-project-role.ts — wrapper de authz para actions.
// Proyecto inexistente y "sin acceso" devuelven ambos NOT_FOUND (no revela existencia a quien
// no tiene ninguna visibilidad); FORBIDDEN solo cuando el rol resuelto no está permitido.

import { resolveProjectAccess } from "@/features/projects/queries/resolve-project-access";
import type { ProjectRole } from "@/features/projects/schemas/roles";
import type { ActionError } from "@/types/action-result";

export async function requireProjectRole(
  userId: string,
  projectId: string,
  allowed: ProjectRole[],
): Promise<
  { ok: true; role: ProjectRole } | { ok: false; error: ActionError }
> {
  const access = await resolveProjectAccess(userId, projectId);

  if (!access) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Proyecto no encontrado" },
    };
  }

  if (!allowed.includes(access.role)) {
    return {
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "No tienes permiso para esta acción",
      },
    };
  }

  return { ok: true, role: access.role };
}
