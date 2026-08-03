// src/features/catalogs/actions/create-microphone.ts

"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { microphoneSpecSchema } from "@/contracts/microphone-spec.schema";
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

export async function createMicrophone(
  brand: string,
  model: string,
  specJson: string,
): Promise<ActionResult<{ id: string }>> {
  const activeUser = await requireSuperAdmin();
  if (!activeUser.ok) return activeUser;

  const parsed = createEquipmentSchema.safeParse({ brand, model, specJson });
  if (!parsed.success) return validationError(firstIssue(parsed.error));

  const spec = parseSpecJson(microphoneSpecSchema, parsed.data.specJson);
  if (!spec.ok) return validationError(spec.message);

  try {
    const microphone = await db.catalogMicrophone.create({
      data: {
        brand: parsed.data.brand,
        model: parsed.data.model,
        category: spec.data.kind,
        spec: spec.data as Prisma.InputJsonValue,
        specVersion: spec.data.schemaVersion,
      },
      select: { id: true },
    });

    revalidatePath("/catalogs/microphones");
    return { ok: true, data: { id: microphone.id } };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return validationError("Ya existe un micrófono con esa marca y modelo");
    }
    throw error;
  }
}
