// src/features/catalogs/queries/get-speaker.ts

import { speakerSpecSchema } from "@/contracts/speaker-spec.schema";
import type { CatalogSpeakerDetail } from "@/features/catalogs/types";
import { db } from "@/lib/db";

export async function getSpeaker(
  speakerId: string,
): Promise<CatalogSpeakerDetail | null> {
  const row = await db.catalogSpeaker.findUnique({ where: { id: speakerId } });
  if (!row) return null;

  const parsed =
    row.specVersion === "1" ? speakerSpecSchema.safeParse(row.spec) : null;

  return {
    id: row.id,
    brand: row.brand,
    model: row.model,
    category: row.category,
    verified: row.verified,
    specVersion: row.specVersion,
    spec: parsed?.success ? parsed.data : null,
    specRaw: row.spec,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
