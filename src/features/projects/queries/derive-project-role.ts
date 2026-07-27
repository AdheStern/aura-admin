// src/features/projects/queries/derive-project-role.ts — tabla de precedencia pura (sin Prisma),
// única fuente de verdad de la Sección 4.0. resolveProjectAccess() y listProjectsForUser() llaman
// aquí; no se reimplementa en ningún otro lado.

import {
  ORG_ROLE_TO_PROJECT_ROLE,
  type ProjectRole,
} from "@/features/projects/schemas/roles";

export type DeriveProjectRoleInput = {
  platformRole: string | null;
  isOwner: boolean;
  memberRole: string | null;
  orgRole: string | null;
};

export function deriveProjectRole(
  input: DeriveProjectRoleInput,
): ProjectRole | null {
  if (input.platformRole === "SUPER_ADMIN") return "OWNER";
  if (input.isOwner) return "OWNER";
  if (
    input.memberRole === "OWNER" ||
    input.memberRole === "EDITOR" ||
    input.memberRole === "VIEWER"
  ) {
    return input.memberRole;
  }
  if (input.orgRole && input.orgRole in ORG_ROLE_TO_PROJECT_ROLE) {
    return ORG_ROLE_TO_PROJECT_ROLE[input.orgRole];
  }
  return null;
}
