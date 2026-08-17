// src/lib/llm-providers.ts — cómo se le pide texto a cada uno de los tres proveedores.
//
// Cada entrada sabe SOLO dos cosas: qué cuerpo POSTear y cómo sacar el texto de su envoltura. El
// prompt, el timeout y el manejo de errores son comunes y viven en llm-client.ts. Mismo criterio
// que aura-engine/app/recommend/llm_providers.py, y por el mismo motivo: son tres POST JSON sin
// streaming ni estado, y tres SDKs con su árbol de dependencias no se pagan solos.
//
// TRAMPA QUE YA COSTÓ UNA VEZ: el id del modelo caduca. El motor se quedó con `gemini-2.0-flash`,
// que Google apagó el 1 de junio de 2026, y desde entonces toda redacción suya cae en el warning
// `llm_writer_unavailable` — el job no falla, solo deja de haber texto, que es justo el fallo que
// nadie mira. Por eso los tres ids están juntos y arriba: cuando uno se retire, se cambia aquí.
//
// La respuesta se lee con zod y no a índice pelado (`body["content"][0]["text"]`) porque la forma
// depende de si el modelo razona: Claude Opus 5 piensa por defecto y mete un bloque `thinking`
// ANTES del texto, así que el primer bloque ya no es el que se busca. Gemini marca sus partes de
// razonamiento con `thought: true`. Coger el índice 0 revienta con los dos.

import { z } from "zod";
import type { LlmProvider } from "@/features/settings/schemas";

/** Verificados en agosto de 2026 contra la documentación viva de cada proveedor. */
const MODELS: Record<LlmProvider, string> = {
  anthropic: "claude-opus-5",
  // GA y sin fecha de retirada anunciada. `gemini-2.0-flash` y `-2.5-flash` sí la tienen.
  google: "gemini-3.5-flash",
  // La familia `deepseek-chat` dio paso a `deepseek-v4-*`.
  deepseek: "deepseek-v4-flash",
};

/**
 * Techo de salida. Generoso a propósito: en los modelos que razonan el presupuesto cubre también
 * los tokens de pensamiento, y quedarse corto no da un error sino un JSON cortado por la mitad.
 */
const MAX_OUTPUT_TOKENS = 8192;

export type LlmReply = {
  text: string | null;
  /** Por qué paró el modelo. Se arrastra hasta el error: sin él, "no es JSON" no dice nada. */
  finishReason: string | null;
};

export type LlmRequest = {
  url: string;
  headers: Record<string, string>;
  body: unknown;
  readText: (body: unknown) => LlmReply;
};

/**
 * `jsonSchema` es la ESTRUCTURA que debe tener la respuesta. Solo Google lo usa hoy: es el único
 * de los tres cuyo modo JSON sin esquema corta respuestas a media llave (ver
 * mix-advice-json-schema.ts). Los otros dos se quedan con la instrucción del prompt, que es lo que
 * venían haciendo — cambiarles el modo sin poder probarlo contra su API sería peor que dejarlos.
 */
export function buildRequest(
  provider: LlmProvider,
  apiKey: string,
  prompt: string,
  jsonSchema?: Record<string, unknown>,
): LlmRequest {
  if (provider === "anthropic") return anthropic(apiKey, prompt);
  if (provider === "google") return google(apiKey, prompt, jsonSchema);
  return deepseek(apiKey, prompt);
}

export function modelOf(provider: LlmProvider): string {
  return MODELS[provider];
}

const anthropicReply = z.object({
  content: z.array(
    z.looseObject({ type: z.string(), text: z.string().optional() }),
  ),
  stop_reason: z.string().nullable().optional(),
});

function anthropic(apiKey: string, prompt: string): LlmRequest {
  return {
    url: "https://api.anthropic.com/v1/messages",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: {
      model: MODELS.anthropic,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [{ role: "user", content: prompt }],
    },
    readText: (raw) => {
      const parsed = anthropicReply.safeParse(raw);
      if (!parsed.success) return { text: null, finishReason: null };
      // El primer bloque de tipo `text`, no el primer bloque: delante puede ir el `thinking`.
      const block = parsed.data.content.find((item) => item.type === "text");
      return {
        text: block?.text ?? null,
        finishReason: parsed.data.stop_reason ?? null,
      };
    },
  };
}

const googleReply = z.object({
  candidates: z
    .array(
      z.looseObject({
        finishReason: z.string().optional(),
        content: z
          .looseObject({
            parts: z
              .array(
                z.looseObject({
                  text: z.string().optional(),
                  thought: z.boolean().optional(),
                }),
              )
              .optional(),
          })
          .optional(),
      }),
    )
    .min(1),
});

function google(
  apiKey: string,
  prompt: string,
  jsonSchema?: Record<string, unknown>,
): LlmRequest {
  return {
    url: `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.google}:generateContent`,
    headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
    body: {
      contents: [{ parts: [{ text: prompt }] }],
      // El mime-type solo no basta: sin `responseSchema` la respuesta se corta a media llave una
      // de cada tres veces, informando STOP. El campo es `responseSchema`, no `responseJsonSchema`.
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        ...(jsonSchema ? { responseSchema: jsonSchema } : {}),
      },
    },
    readText: (raw) => {
      const parsed = googleReply.safeParse(raw);
      if (!parsed.success) return { text: null, finishReason: null };

      const candidate = parsed.data.candidates[0];
      const parts = candidate?.content?.parts ?? [];
      const text = parts
        .filter((part) => part.thought !== true && part.text)
        .map((part) => part.text)
        .join("");
      return {
        text: text || null,
        finishReason: candidate?.finishReason ?? null,
      };
    },
  };
}

const deepseekReply = z.object({
  choices: z
    .array(
      z.looseObject({
        message: z.looseObject({ content: z.string().nullable().optional() }),
        finish_reason: z.string().nullable().optional(),
      }),
    )
    .min(1),
});

function deepseek(apiKey: string, prompt: string): LlmRequest {
  return {
    url: "https://api.deepseek.com/chat/completions",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: {
      model: MODELS.deepseek,
      max_tokens: MAX_OUTPUT_TOKENS,
      // Exige que la palabra "json" aparezca en el prompt; el de mezcla la lleva de sobra.
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    },
    readText: (raw) => {
      const parsed = deepseekReply.safeParse(raw);
      if (!parsed.success) return { text: null, finishReason: null };

      const choice = parsed.data.choices[0];
      return {
        text: choice?.message.content ?? null,
        finishReason: choice?.finish_reason ?? null,
      };
    },
  };
}
