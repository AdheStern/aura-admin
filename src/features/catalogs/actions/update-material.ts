// src/features/catalogs/actions/update-material.ts

"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { materialSpecSchema } from "@/contracts/material-spec.schema";
import { parseSpecJson } from "@/features/catalogs/schemas/parse-spec-json";
import { updateMaterialSchema } from "@/features/catalogs/schemas/update-material";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function updateMaterial(
  materialId: string,
  specJson: string,
  verified: boolean,
): Promise<ActionResult> {
  const activeUser = await requireSuperAdmin();
  if (!activeUser.ok) return activeUser;

  const parsed = updateMaterialSchema.safeParse({
    materialId,
    specJson,
    verified,
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

  const spec = parseSpecJson(materialSpecSchema, parsed.data.specJson);
  if (!spec.ok) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: spec.message },
    };
  }

  await db.catalogMaterial.update({
    where: { id: parsed.data.materialId },
    data: {
      name: spec.data.name,
      category: spec.data.category,
      spec: spec.data as Prisma.InputJsonValue,
      specVersion: spec.data.schemaVersion,
      verified: parsed.data.verified,
    },
  });

  revalidatePath("/catalogs/materials");
  revalidatePath(`/catalogs/materials/${parsed.data.materialId}`);
  return { ok: true };
}
