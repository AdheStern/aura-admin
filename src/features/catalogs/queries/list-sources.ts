// src/features/catalogs/queries/list-sources.ts

import type { CatalogNamedListItem } from "@/features/catalogs/types";
import { db } from "@/lib/db";

export async function listSources(
  category?: string,
): Promise<CatalogNamedListItem[]> {
  return db.catalogSource.findMany({
    where: category ? { category } : undefined,
    select: {
      id: true,
      name: true,
      category: true,
      verified: true,
      updatedAt: true,
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}
