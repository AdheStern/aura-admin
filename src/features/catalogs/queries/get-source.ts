// src/features/catalogs/queries/get-source.ts

import type { SourceSpec } from "@/contracts/source-spec.schema";
import { sourceSpecSchema } from "@/contracts/source-spec.schema";
import type { CatalogNamedDetail } from "@/features/catalogs/types";
import { db } from "@/lib/db";

export async function getSource(
  sourceId: string,
): Promise<CatalogNamedDetail<SourceSpec> | null> {
  const row = await db.catalogSource.findUnique({ where: { id: sourceId } });
  if (!row) return null;

  const parsed =
    row.specVersion === "1" ? sourceSpecSchema.safeParse(row.spec) : null;

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
