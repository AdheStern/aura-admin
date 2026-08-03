// src/features/catalogs/actions/create-material.ts

"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { materialSpecSchema } from "@/contracts/material-spec.schema";
import {
  firstIssue,
  validationError,
} from "@/features/catalogs/schemas/action-errors";
import { createMaterialSchema } from "@/features/catalogs/schemas/create-material";
import { parseSpecJson } from "@/features/catalogs/schemas/parse-spec-json";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function createMaterial(
  specJson: string,
): Promise<ActionResult<{ id: string }>> {
  const activeUser = await requireSuperAdmin();
  if (!activeUser.ok) return activeUser;

  const parsed = createMaterialSchema.safeParse({ specJson });
  if (!parsed.success) return validationError(firstIssue(parsed.error));

  const spec = parseSpecJson(materialSpecSchema, parsed.data.specJson);
  if (!spec.ok) return validationError(spec.message);

  const material = await db.catalogMaterial.create({
    data: {
      name: spec.data.name,
      category: spec.data.category,
      spec: spec.data as Prisma.InputJsonValue,
      specVersion: spec.data.schemaVersion,
    },
    select: { id: true },
  });

  revalidatePath("/catalogs/materials");
  return { ok: true, data: { id: material.id } };
}
