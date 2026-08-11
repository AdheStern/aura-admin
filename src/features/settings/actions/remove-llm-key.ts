// src/features/settings/actions/remove-llm-key.ts — borra la clave guardada.
//
// Deja el proveedor elegido: quitar la clave es dejar de pagar el LLM, no olvidar a quién se le
// pagaba. Sin clave el motor vuelve a sus plantillas deterministas y las recomendaciones siguen
// saliendo con las mismas cifras.

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function removeLlmKey(): Promise<ActionResult<null>> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  await db.userSettings.updateMany({
    where: { userId: activeUser.data.id },
    data: { llmApiKeyCipher: null },
  });

  revalidatePath("/settings");
  return { ok: true, data: null };
}
