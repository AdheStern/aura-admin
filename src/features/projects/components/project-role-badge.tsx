// src/features/projects/components/project-role-badge.tsx

import { Badge } from "@/components/ui/badge";
import type { ProjectRole } from "@/features/projects/schemas/roles";

const ROLE_LABEL: Record<ProjectRole, string> = {
  OWNER: "Dueño",
  EDITOR: "Editor",
  VIEWER: "Lector",
};

const ROLE_VARIANT: Record<ProjectRole, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  EDITOR: "secondary",
  VIEWER: "outline",
};

export function ProjectRoleBadge({ role }: { role: ProjectRole }) {
  return <Badge variant={ROLE_VARIANT[role]}>{ROLE_LABEL[role]}</Badge>;
}
