// src/features/catalogs/actions/delete-source.ts

"use server";

import { revalidatePath } from "next/cache";
import {
  firstIssue,
  validationError,
} from "@/features/catalogs/schemas/action-errors";
import { catalogIdSchema } from "@/features/catalogs/schemas/ids";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function deleteSource(sourceId: string): Promise<ActionResult> {
  const activeUser = await requireSuperAdmin();
  if (!activeUser.ok) return activeUser;

  const parsed = catalogIdSchema.safeParse(sourceId);
  if (!parsed.success) return validationError(firstIssue(parsed.error));

  // Sin FK: Scene.signalFlow referencia la fuente por id embebido en JSON (referencia blanda,
  // por diseño del grafo de señal). Borrar una referenciada deja una referencia colgante.
  await db.catalogSource.delete({ where: { id: parsed.data } });

  revalidatePath("/catalogs/sources");
  return { ok: true };
}
