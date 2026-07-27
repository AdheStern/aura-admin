// src/features/projects/schemas/roles.ts — namespace de roles de proyecto (Sección 4.0)

import { z } from "zod";

export const projectRoleSchema = z.enum(["OWNER", "EDITOR", "VIEWER"]);
export type ProjectRole = z.infer<typeof projectRoleSchema>;

// Espejo de better-auth/dist/plugins/organization/access/statement.mjs → defaultRoles
// (admin/owner/member, siempre minúscula). Namespace distinto al de ProjectRole aunque
// comparta la palabra "owner" — nunca comparar los strings crudos entre sí.
export const ORG_ROLE_TO_PROJECT_ROLE: Record<string, ProjectRole> = {
  owner: "EDITOR",
  admin: "EDITOR",
  member: "VIEWER",
};
