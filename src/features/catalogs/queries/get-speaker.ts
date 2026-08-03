// src/features/catalogs/queries/get-speaker.ts

import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";
import { speakerSpecSchema } from "@/contracts/speaker-spec.schema";
import { toEquipmentDetail } from "@/features/catalogs/queries/to-equipment-detail";
import type { CatalogEquipmentDetail } from "@/features/catalogs/types";
import { db } from "@/lib/db";

export async function getSpeaker(
  speakerId: string,
): Promise<CatalogEquipmentDetail<SpeakerSpec> | null> {
  const row = await db.catalogSpeaker.findUnique({ where: { id: speakerId } });
  if (!row) return null;

  return toEquipmentDetail(row, speakerSpecSchema);
}
