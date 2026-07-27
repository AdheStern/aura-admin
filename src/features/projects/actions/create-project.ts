// src/features/projects/actions/create-project.ts

"use server";

import { revalidatePath } from "next/cache";
import { createProjectSchema } from "@/features/projects/schemas/create-project";
import { db } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function createProject(
  name: string,
  description?: string,
): Promise<ActionResult<{ id: string }>> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsed = createProjectSchema.safeParse({ name, description });
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Datos inválidos",
      },
    };
  }

  const project = await db.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      ownerId: activeUser.data.id,
    },
    select: { id: true },
  });

  revalidatePath("/projects");
  return { ok: true, data: { id: project.id } };
}
