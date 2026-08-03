// src/features/catalogs/actions/delete-console.ts

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

export async function deleteConsole(consoleId: string): Promise<ActionResult> {
  const activeUser = await requireSuperAdmin();
  if (!activeUser.ok) return activeUser;

  const parsed = catalogIdSchema.safeParse(consoleId);
  if (!parsed.success) return validationError(firstIssue(parsed.error));

  // Sin FK: Scene.signalFlow referencia el equipo por id embebido en JSON (referencia blanda,
  // por diseño del grafo de señal). Borrar uno referenciado puede dejar una referencia colgante.
  await db.catalogConsole.delete({ where: { id: parsed.data } });

  revalidatePath("/catalogs/consoles");
  return { ok: true };
}
