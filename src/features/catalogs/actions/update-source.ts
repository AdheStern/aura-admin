// src/features/catalogs/actions/update-source.ts

"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sourceSpecSchema } from "@/contracts/source-spec.schema";
import {
  firstIssue,
  isUniqueViolation,
  validationError,
} from "@/features/catalogs/schemas/action-errors";
import { updateNamedItemSchema } from "@/features/catalogs/schemas/named-item";
import { parseSpecJson } from "@/features/catalogs/schemas/parse-spec-json";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function updateSource(
  sourceId: string,
  specJson: string,
  verified: boolean,
): Promise<ActionResult> {
  const activeUser = await requireSuperAdmin();
  if (!activeUser.ok) return activeUser;

  const parsed = updateNamedItemSchema.safeParse({
    itemId: sourceId,
    specJson,
    verified,
  });
  if (!parsed.success) return validationError(firstIssue(parsed.error));

  const spec = parseSpecJson(sourceSpecSchema, parsed.data.specJson);
  if (!spec.ok) return validationError(spec.message);

  try {
    await db.catalogSource.update({
      where: { id: parsed.data.itemId },
      data: {
        name: spec.data.name,
        category: spec.data.kind,
        spec: spec.data as Prisma.InputJsonValue,
        specVersion: spec.data.schemaVersion,
        verified: parsed.data.verified,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return validationError("Ya existe una fuente con ese nombre");
    }
    throw error;
  }

  revalidatePath("/catalogs/sources");
  revalidatePath(`/catalogs/sources/${parsed.data.itemId}`);
  return { ok: true };
}
