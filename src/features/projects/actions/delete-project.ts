// src/features/projects/actions/delete-project.ts

"use server";

import { revalidatePath } from "next/cache";
import { requireProjectRole } from "@/features/projects/queries/require-project-role";
import { projectIdSchema } from "@/features/projects/schemas/ids";
import { db } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function deleteProject(projectId: string): Promise<ActionResult> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsed = projectIdSchema.safeParse(projectId);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "ID inválido",
      },
    };
  }

  const access = await requireProjectRole(activeUser.data.id, parsed.data, [
    "OWNER",
  ]);
  if (!access.ok) return access;

  // onDelete: Cascade en ProjectMember/Scene se encarga de la limpieza asociada.
  await db.project.delete({ where: { id: parsed.data } });

  revalidatePath("/projects");
  return { ok: true };
}
