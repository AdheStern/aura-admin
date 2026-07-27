// src/features/projects/actions/remove-project-member.ts

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireProjectRole } from "@/features/projects/queries/require-project-role";
import { projectIdSchema, userIdSchema } from "@/features/projects/schemas/ids";
import { db } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

const removeProjectMemberSchema = z.object({
  projectId: projectIdSchema,
  userId: userIdSchema,
});

export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<ActionResult> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsed = removeProjectMemberSchema.safeParse({ projectId, userId });
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

  // Guardia defensiva: el owner nunca tiene fila propia en project_member, pero no se permite
  // "removerlo" por esta vía aunque alguien la invoque directamente con su userId.
  const project = await db.project.findUnique({
    where: { id: parsed.data.projectId },
    select: { ownerId: true },
  });
  if (project?.ownerId === parsed.data.userId) {
    return {
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "No puedes quitar al dueño del proyecto",
      },
    };
  }

  await db.projectMember.deleteMany({
    where: { projectId: parsed.data.projectId, userId: parsed.data.userId },
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { ok: true };
}
