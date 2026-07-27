// src/features/catalogs/actions/delete-speaker.ts

"use server";

import { revalidatePath } from "next/cache";
import { catalogSpeakerIdSchema } from "@/features/catalogs/schemas/ids";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function deleteSpeaker(speakerId: string): Promise<ActionResult> {
  const activeUser = await requireSuperAdmin();
  if (!activeUser.ok) return activeUser;

  const parsed = catalogSpeakerIdSchema.safeParse(speakerId);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "ID inválido",
      },
    };
  }

  // Sin FK: Scene.signalFlow referencia parlantes por id embebido en JSON (referencia blanda,
  // por diseño del grafo de señal). Borrar uno referenciado puede dejar una referencia colgante
  // en escenas existentes — tradeoff ya aceptado del modelo JSONB, no se resuelve aquí.
  await db.catalogSpeaker.delete({ where: { id: parsed.data } });

  revalidatePath("/catalogs/speakers");
  return { ok: true };
}
