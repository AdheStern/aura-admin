// src/features/catalogs/queries/get-material.ts

import type { MaterialSpec } from "@/contracts/material-spec.schema";
import { materialSpecSchema } from "@/contracts/material-spec.schema";
import type { CatalogNamedDetail } from "@/features/catalogs/types";
import { db } from "@/lib/db";

export async function getMaterial(
  materialId: string,
): Promise<CatalogNamedDetail<MaterialSpec> | null> {
  const row = await db.catalogMaterial.findUnique({
    where: { id: materialId },
  });
  if (!row) return null;

  const parsed =
    row.specVersion === "1" ? materialSpecSchema.safeParse(row.spec) : null;

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    verified: row.verified,
    specVersion: row.specVersion,
    spec: parsed?.success ? parsed.data : null,
    specRaw: row.spec,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
