// src/features/scenes/actions/delete-scene.ts — archivo único (Sección 5 del doc maestro)

"use server";

import { revalidatePath } from "next/cache";
import { requireProjectRole } from "@/features/projects/queries/require-project-role";
import { sceneIdSchema } from "@/features/scenes/schemas";
import { db } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function deleteScene(sceneId: string): Promise<ActionResult> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsed = sceneIdSchema.safeParse(sceneId);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "ID inválido",
      },
    };
  }

  const scene = await db.scene.findUnique({
    where: { id: parsed.data },
    select: { projectId: true },
  });
  if (!scene) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Escena no encontrada" },
    };
  }

  const access = await requireProjectRole(activeUser.data.id, scene.projectId, [
    "OWNER",
    "EDITOR",
  ]);
  if (!access.ok) return access;

  await db.scene.delete({ where: { id: parsed.data } });

  revalidatePath(`/projects/${scene.projectId}`);
  return { ok: true };
}
