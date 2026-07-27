// src/features/catalogs/actions/delete-material.ts

"use server";

import { revalidatePath } from "next/cache";
import { catalogMaterialIdSchema } from "@/features/catalogs/schemas/ids";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function deleteMaterial(
  materialId: string,
): Promise<ActionResult> {
  const activeUser = await requireSuperAdmin();
  if (!activeUser.ok) return activeUser;

  const parsed = catalogMaterialIdSchema.safeParse(materialId);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "ID inválido",
      },
    };
  }

  await db.catalogMaterial.delete({ where: { id: parsed.data } });

  revalidatePath("/catalogs/materials");
  return { ok: true };
}
