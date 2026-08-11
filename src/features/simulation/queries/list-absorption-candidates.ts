// src/features/simulation/queries/list-absorption-candidates.ts — el catálogo, con su absorción.
//
// list-room-material-options.ts no sirve aquí: devuelve nombre y categoría para el picker, y esto
// necesita los coeficientes por banda, que viven en la columna `spec`.
//
// Una fila con otra specVersion se OMITE en vez de reventar, igual que resolveSceneMaterials: un
// material que este build no sabe leer no puede proponerse como solución.

import { materialSpecSchema } from "@/contracts/material-spec.schema";
import type { AbsorptionCandidate } from "@/features/simulation/model/suggest-treatment";
import { db } from "@/lib/db";

export async function listAbsorptionCandidates(): Promise<
  AbsorptionCandidate[]
> {
  const rows = await db.catalogMaterial.findMany({
    select: { id: true, name: true, spec: true, specVersion: true },
    orderBy: { name: "asc" },
  });

  const candidates: AbsorptionCandidate[] = [];
  for (const row of rows) {
    if (row.specVersion !== "1") continue;

    const parsed = materialSpecSchema.safeParse(row.spec);
    if (!parsed.success) continue;

    candidates.push({
      id: row.id,
      name: row.name,
      absorption: parsed.data.absorption,
    });
  }

  return candidates;
}
