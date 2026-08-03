// src/features/catalogs/queries/get-amplifier.ts

import type { AmplifierSpec } from "@/contracts/amplifier-spec.schema";
import { amplifierSpecSchema } from "@/contracts/amplifier-spec.schema";
import { toEquipmentDetail } from "@/features/catalogs/queries/to-equipment-detail";
import type { CatalogEquipmentDetail } from "@/features/catalogs/types";
import { db } from "@/lib/db";

export async function getAmplifier(
  amplifierId: string,
): Promise<CatalogEquipmentDetail<AmplifierSpec> | null> {
  const row = await db.catalogAmplifier.findUnique({
    where: { id: amplifierId },
  });
  if (!row) return null;

  return toEquipmentDetail(row, amplifierSpecSchema);
}
