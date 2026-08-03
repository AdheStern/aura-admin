// src/features/catalogs/actions/delete-material.ts

"use server";

import { revalidatePath } from "next/cache";
import {
  firstIssue,
  validationError,
} from "@/features/catalogs/schemas/action-errors";
import { catalogIdSchema } from "@/features/catalogs/schemas/ids";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function deleteMaterial(
  materialId: string,
): Promise<ActionResult> {
  const activeUser = await requireSuperAdmin();
  if (!activeUser.ok) return activeUser;

  const parsed = catalogIdSchema.safeParse(materialId);
  if (!parsed.success) return validationError(firstIssue(parsed.error));

  // Sin FK: Scene.room referencia materiales por id embebido en JSON. Borrar uno referenciado
  // puede dejar una referencia colgante — tradeoff aceptado del modelo JSONB, no se resuelve aquí.
  await db.catalogMaterial.delete({ where: { id: parsed.data } });

  revalidatePath("/catalogs/materials");
  return { ok: true };
}
