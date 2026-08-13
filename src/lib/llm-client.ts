// src/lib/llm-client.ts — una llamada a un LLM con la clave del usuario, desde la app.
//
// Existe aparte del motor a propósito. El motor es una función pura de física (ADR-03) y su LLM
// solo REDACTA hechos ya calculados (ADR-05); esto es lo contrario: criterio de mezcla por
// instrumento, que ninguna de las siete reglas puede dar porque el motor no modela instrumentos
// —sus `sources` son cajas acústicas. Por eso vive aquí, donde están el grafo y la clave.
//
// Un intento y sin reintentos: si el proveedor falla, la vista sigue enseñando toda la física y
// solo falta el consejo. Reintentar gastaría el presupuesto del usuario dos veces por un texto
// que es opcional por definición.
//
// El mensaje de error se lava con scrubSecrets antes de salir: la respuesta de error de un
// proveedor a veces devuelve la petición entera, y esa lleva la clave.

import type { LlmProvider } from "@/features/settings/schemas";
import { buildRequest, modelOf } from "@/lib/llm-providers";
import { scrubSecrets } from "@/lib/scrub-secrets";

const TIMEOUT_MS = 120_000;

export type LlmConfig = { provider: LlmProvider; apiKey: string };

export type LlmCompletion =
  | { ok: true; text: string; finishReason: string | null }
  | { ok: false; message: string };

/**
 * Manda el prompt y devuelve el texto crudo. Validar que sea el JSON esperado es de quien llama.
 *
 * `jsonSchema` describe la estructura que se espera de vuelta. No es adorno: sin él, el modo JSON
 * de Google corta la respuesta a media llave de vez en cuando (ver mix-advice-json-schema.ts).
 */
export async function complete(
  config: LlmConfig,
  prompt: string,
  jsonSchema?: Record<string, unknown>,
): Promise<LlmCompletion> {
  const request = buildRequest(
    config.provider,
    config.apiKey,
    prompt,
    jsonSchema,
  );

  let response: Response;
  try {
    response = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(request.body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    return { ok: false, message: transportMessage(error) };
  }

  const raw = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      message: httpMessage(config.provider, response.status, raw),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "El proveedor devolvió algo que no es JSON." };
  }

  const { text, finishReason } = request.readText(parsed);
  if (text) return { ok: true, text, finishReason };

  return {
    ok: false,
    message: `El proveedor respondió sin texto${reasonSuffix(finishReason)}. Suele ser que el modelo agotó su presupuesto de salida razonando antes de contestar.`,
  };
}

/** El motivo de parada convertido en algo que se pueda leer en pantalla. */
export function reasonSuffix(finishReason: string | null): string {
  return finishReason ? ` (motivo: ${finishReason})` : "";
}

function transportMessage(error: unknown): string {
  if (error instanceof Error && error.name === "TimeoutError") {
    return `El proveedor no contestó en ${TIMEOUT_MS / 1000} s.`;
  }
  return `No se pudo contactar con el proveedor: ${safe(error)}`;
}

/**
 * El 404 se explica en vez de repetirse: es lo que devuelve un proveedor cuando el id del modelo
 * ya no existe, y sin decirlo la pista se pierde entre el resto de errores de red.
 */
function httpMessage(
  provider: LlmProvider,
  status: number,
  raw: string,
): string {
  if (status === 401 || status === 403) {
    return "El proveedor rechazó la clave. Revísala en Ajustes.";
  }
  if (status === 429) {
    return "El proveedor está limitando las peticiones. Inténtalo en un momento.";
  }
  if (status === 404) {
    return `El modelo ${modelOf(provider)} ya no existe en ${provider}: hay que actualizarlo en llm-providers.ts.`;
  }
  return `El proveedor respondió ${status}: ${safe(raw)}`;
}

/** Recorta y tacha: un cuerpo de error puede traer la petición entera, y con ella la clave. */
function safe(value: unknown): string {
  const text =
    value instanceof Error ? value.message : String(scrubSecrets(value));
  const scrubbed = String(scrubSecrets(text));

  return scrubbed.length > 300 ? `${scrubbed.slice(0, 300)}…` : scrubbed;
}
