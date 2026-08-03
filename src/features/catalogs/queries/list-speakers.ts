// src/features/catalogs/queries/list-speakers.ts

import type { CatalogEquipmentListItem } from "@/features/catalogs/types";
import { db } from "@/lib/db";

export async function listSpeakers(
  category?: string,
): Promise<CatalogEquipmentListItem[]> {
  return db.catalogSpeaker.findMany({
    where: category ? { category } : undefined,
    select: {
      id: true,
      brand: true,
      model: true,
      category: true,
      verified: true,
      updatedAt: true,
    },
    orderBy: [{ brand: "asc" }, { model: "asc" }],
  });
}
