// src/features/catalogs/queries/list-material-categories.ts — material.category es texto libre
// (sin enum en el contrato), así que el filtro se llena con lo que ya existe en la BD.

import { db } from "@/lib/db";

export async function listMaterialCategories(): Promise<string[]> {
  const rows = await db.catalogMaterial.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((row) => row.category);
}
