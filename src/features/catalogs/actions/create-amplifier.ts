// src/features/catalogs/actions/create-amplifier.ts

"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { amplifierSpecSchema } from "@/contracts/amplifier-spec.schema";
import {
  firstIssue,
  isUniqueViolation,
  validationError,
} from "@/features/catalogs/schemas/action-errors";
import { createEquipmentSchema } from "@/features/catalogs/schemas/equipment";
import { parseSpecJson } from "@/features/catalogs/schemas/parse-spec-json";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function createAmplifier(
  brand: string,
  model: string,
  specJson: string,
): Promise<ActionResult<{ id: string }>> {
  const activeUser = await requireSuperAdmin();
  if (!activeUser.ok) return activeUser;

  const parsed = createEquipmentSchema.safeParse({ brand, model, specJson });
  if (!parsed.success) return validationError(firstIssue(parsed.error));

  const spec = parseSpecJson(amplifierSpecSchema, parsed.data.specJson);
  if (!spec.ok) return validationError(spec.message);

  try {
    const amplifier = await db.catalogAmplifier.create({
      data: {
        brand: parsed.data.brand,
        model: parsed.data.model,
        category: spec.data.kind,
        spec: spec.data as Prisma.InputJsonValue,
        specVersion: spec.data.schemaVersion,
      },
      select: { id: true },
    });

    revalidatePath("/catalogs/amplifiers");
    return { ok: true, data: { id: amplifier.id } };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return validationError(
        "Ya existe un amplificador con esa marca y modelo",
      );
    }
    throw error;
  }
}
