// src/features/catalogs/actions/update-console.ts

"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { consoleSpecSchema } from "@/contracts/console-spec.schema";
import {
  firstIssue,
  isUniqueViolation,
  validationError,
} from "@/features/catalogs/schemas/action-errors";
import { updateEquipmentSchema } from "@/features/catalogs/schemas/equipment";
import { parseSpecJson } from "@/features/catalogs/schemas/parse-spec-json";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function updateConsole(
  consoleId: string,
  brand: string,
  model: string,
  specJson: string,
  verified: boolean,
): Promise<ActionResult> {
  const activeUser = await requireSuperAdmin();
  if (!activeUser.ok) return activeUser;

  const parsed = updateEquipmentSchema.safeParse({
    equipmentId: consoleId,
    brand,
    model,
    specJson,
    verified,
  });
  if (!parsed.success) return validationError(firstIssue(parsed.error));

  const spec = parseSpecJson(consoleSpecSchema, parsed.data.specJson);
  if (!spec.ok) return validationError(spec.message);

  try {
    await db.catalogConsole.update({
      where: { id: parsed.data.equipmentId },
      data: {
        brand: parsed.data.brand,
        model: parsed.data.model,
        category: spec.data.kind,
        spec: spec.data as Prisma.InputJsonValue,
        specVersion: spec.data.schemaVersion,
        verified: parsed.data.verified,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return validationError("Ya existe una consola con esa marca y modelo");
    }
    throw error;
  }

  revalidatePath("/catalogs/consoles");
  revalidatePath(`/catalogs/consoles/${parsed.data.equipmentId}`);
  return { ok: true };
}
