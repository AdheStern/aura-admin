// src/features/catalogs/queries/get-microphone.ts

import type { MicrophoneSpec } from "@/contracts/microphone-spec.schema";
import { microphoneSpecSchema } from "@/contracts/microphone-spec.schema";
import { toEquipmentDetail } from "@/features/catalogs/queries/to-equipment-detail";
import type { CatalogEquipmentDetail } from "@/features/catalogs/types";
import { db } from "@/lib/db";

export async function getMicrophone(
  microphoneId: string,
): Promise<CatalogEquipmentDetail<MicrophoneSpec> | null> {
  const row = await db.catalogMicrophone.findUnique({
    where: { id: microphoneId },
  });
  if (!row) return null;

  return toEquipmentDetail(row, microphoneSpecSchema);
}
