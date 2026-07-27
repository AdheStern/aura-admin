// src/features/projects/actions/update-project.ts

"use server";

import { revalidatePath } from "next/cache";
import { requireProjectRole } from "@/features/projects/queries/require-project-role";
import { updateProjectSchema } from "@/features/projects/schemas/update-project";
import { db } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function updateProject(
  projectId: string,
  name: string,
  description?: string,
): Promise<ActionResult> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsed = updateProjectSchema.safeParse({
    projectId,
    name,
    description,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Datos inválidos",
      },
    };
  }

  const access = await requireProjectRole(
    activeUser.data.id,
    parsed.data.projectId,
    ["OWNER"],
  );
  if (!access.ok) return access;

  await db.project.update({
    where: { id: parsed.data.projectId },
    data: { name: parsed.data.name, description: parsed.data.description },
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { ok: true };
}
