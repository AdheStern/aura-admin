// src/features/catalogs/queries/get-console.ts

import type { ConsoleSpec } from "@/contracts/console-spec.schema";
import { consoleSpecSchema } from "@/contracts/console-spec.schema";
import { toEquipmentDetail } from "@/features/catalogs/queries/to-equipment-detail";
import type { CatalogEquipmentDetail } from "@/features/catalogs/types";
import { db } from "@/lib/db";

export async function getConsole(
  consoleId: string,
): Promise<CatalogEquipmentDetail<ConsoleSpec> | null> {
  const row = await db.catalogConsole.findUnique({ where: { id: consoleId } });
  if (!row) return null;

  return toEquipmentDetail(row, consoleSpecSchema);
}
