// src/features/catalogs/actions/create-source.ts

"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sourceSpecSchema } from "@/contracts/source-spec.schema";
import {
  firstIssue,
  isUniqueViolation,
  validationError,
} from "@/features/catalogs/schemas/action-errors";
import { createNamedItemSchema } from "@/features/catalogs/schemas/named-item";
import { parseSpecJson } from "@/features/catalogs/schemas/parse-spec-json";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function createSource(
  specJson: string,
): Promise<ActionResult<{ id: string }>> {
  const activeUser = await requireSuperAdmin();
  if (!activeUser.ok) return activeUser;

  const parsed = createNamedItemSchema.safeParse({ specJson });
  if (!parsed.success) return validationError(firstIssue(parsed.error));

  const spec = parseSpecJson(sourceSpecSchema, parsed.data.specJson);
  if (!spec.ok) return validationError(spec.message);

  try {
    const source = await db.catalogSource.create({
      data: {
        name: spec.data.name,
        category: spec.data.kind,
        spec: spec.data as Prisma.InputJsonValue,
        specVersion: spec.data.schemaVersion,
      },
      select: { id: true },
    });

    revalidatePath("/catalogs/sources");
    return { ok: true, data: { id: source.id } };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return validationError("Ya existe una fuente con ese nombre");
    }
    throw error;
  }
}
