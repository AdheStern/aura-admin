// src/features/catalogs/queries/list-materials.ts

import type { CatalogMaterialListItem } from "@/features/catalogs/types";
import { db } from "@/lib/db";

export async function listMaterials(
  category?: string,
): Promise<CatalogMaterialListItem[]> {
  const materials = await db.catalogMaterial.findMany({
    where: category ? { category } : undefined,
    select: {
      id: true,
      name: true,
      category: true,
      verified: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });
  return materials;
}
