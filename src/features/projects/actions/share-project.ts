// src/features/projects/actions/share-project.ts

"use server";

import { revalidatePath } from "next/cache";
import { requireProjectRole } from "@/features/projects/queries/require-project-role";
import { shareProjectSchema } from "@/features/projects/schemas/share-project";
import { db } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function shareProject(
  projectId: string,
  email: string,
  role: "EDITOR" | "VIEWER",
): Promise<ActionResult> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsed = shareProjectSchema.safeParse({ projectId, email, role });
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

  const targetUser = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (!targetUser) {
    return {
      ok: false,
      error: {
        code: "USER_NOT_FOUND",
        message:
          "No existe ninguna cuenta con ese email. Pídele que se registre primero.",
      },
    };
  }

  await db.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId: parsed.data.projectId,
        userId: targetUser.id,
      },
    },
    create: {
      projectId: parsed.data.projectId,
      userId: targetUser.id,
      role: parsed.data.role,
    },
    update: { role: parsed.data.role },
  });

  revalidatePath(`/projects/${parsed.data.projectId}`);
  return { ok: true };
}
