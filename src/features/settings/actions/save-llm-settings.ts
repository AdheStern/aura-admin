// src/features/settings/actions/save-llm-settings.ts — guarda proveedor y clave del LLM.
//
// La clave se cifra ANTES de tocar la BD (ADR-08) y una clave vacía significa "deja la que había":
// el formulario nunca recibe la guardada, así que reenviar el formulario para cambiar solo el
// proveedor no puede costarle al usuario su clave.

"use server";

import { revalidatePath } from "next/cache";
import {
  type SaveLlmSettingsInput,
  saveLlmSettingsSchema,
} from "@/features/settings/schemas";
import { encryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function saveLlmSettings(
  input: SaveLlmSettingsInput,
): Promise<ActionResult<null>> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsed = saveLlmSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Ajustes inválidos",
      },
    };
  }

  const { provider, apiKey } = parsed.data;
  const cipher = apiKey ? { llmApiKeyCipher: encryptSecret(apiKey) } : {};
  const userId = activeUser.data.id;

  await db.userSettings.upsert({
    where: { userId },
    create: { userId, llmProvider: provider, ...cipher },
    update: { llmProvider: provider, ...cipher },
  });

  revalidatePath("/settings");
  return { ok: true, data: null };
}
