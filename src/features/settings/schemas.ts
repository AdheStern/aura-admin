// src/features/settings/schemas.ts — preferencias del usuario (Sección 4.1).
//
// El enum de proveedores sale del contrato y no de una lista propia: es el motor quien sabe a
// quién puede llamar (llm_providers.py), y duplicar la lista aquí la dejaría desincronizada el día
// que se añada uno.

import { z } from "zod";
import { simulationLlmConfigSchema } from "@/contracts";

export const llmProviderSchema = simulationLlmConfigSchema.shape.provider;

export type LlmProvider = z.infer<typeof llmProviderSchema>;

export const PROVIDER_LABELS: Record<LlmProvider, string> = {
  anthropic: "Anthropic (Claude)",
  google: "Google (Gemini)",
  deepseek: "DeepSeek",
};

/** Sin recortar: una clave con espacios al borde es un copiado descuidado, no otra clave. */
export const llmApiKeySchema = z
  .string()
  .trim()
  .min(20, "Esa clave es demasiado corta para ser válida")
  .max(500, "Esa clave es demasiado larga");

export const saveLlmSettingsSchema = z.object({
  provider: llmProviderSchema,
  /** Vacío = conservar la que ya estaba; solo se escribe si llega una nueva. */
  apiKey: llmApiKeySchema.optional(),
});

export type SaveLlmSettingsInput = z.infer<typeof saveLlmSettingsSchema>;
