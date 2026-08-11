// src/features/settings/queries/get-llm-settings.ts — lo que la UI puede saber de la clave.
//
// Devuelve si hay clave y sus últimos cuatro caracteres, nunca la clave. Una vez guardada no vuelve
// al cliente jamás (ADR-08): quien quiera cambiarla escribe una nueva, que es además lo que uno
// hace de todos modos cuando rota un secreto.

import type { LlmProvider } from "@/features/settings/schemas";
import { decryptSecret, secretHint } from "@/lib/crypto";
import { db } from "@/lib/db";

export type LlmSettings = {
  provider: LlmProvider | null;
  hasApiKey: boolean;
  /** Los últimos 4 caracteres, para reconocer cuál está puesta. null si no se puede descifrar. */
  apiKeyHint: string | null;
};

export const EMPTY_LLM_SETTINGS: LlmSettings = {
  provider: null,
  hasApiKey: false,
  apiKeyHint: null,
};

export async function getLlmSettings(userId: string): Promise<LlmSettings> {
  const settings = await db.userSettings.findUnique({
    where: { userId },
    select: { llmProvider: true, llmApiKeyCipher: true },
  });
  if (!settings) return EMPTY_LLM_SETTINGS;

  const key = settings.llmApiKeyCipher
    ? decryptSecret(settings.llmApiKeyCipher)
    : null;

  return {
    provider: (settings.llmProvider as LlmProvider | null) ?? null,
    // Hay clave guardada aunque no se pueda descifrar: la UI debe poder decir que algo hay y que
    // no sirve, en vez de fingir que el usuario nunca la puso.
    hasApiKey: settings.llmApiKeyCipher !== null,
    apiKeyHint: key ? secretHint(key) : null,
  };
}
