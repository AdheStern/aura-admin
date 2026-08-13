// src/features/simulation/schemas/mix-advice.ts — lo que la IA devuelve para la mezcla.
//
// Contrato INTERNO de la app, no del motor: esto no cruza a aura-engine ni pasa por el
// procedimiento de la Sección 07. El motor sigue siendo una función pura de física; esto es una
// capa de criterio de mezcla que vive aquí porque aquí están los resultados y la clave del usuario.
//
// La forma es la del MVP (`McpAnalysis`) a propósito: ya está probada contra lo que un modelo
// devuelve de verdad, y cambiarla solo por gusto obligaría a reescribir el prompt entero.
//
// Se valida con zod y no se hace JSON.parse a pelo —regla (1) de ingesta— porque esto NO es
// determinista: el modelo puede devolver una banda sin Q, una ganancia absurda o un id de
// instrumento que no existe en la escena. Un `.catch()` silencioso pintaría un plugin con huecos.
//
// Los rangos no son decoración: ±24 dB y Q de 0.1 a 18 son los límites de un paramétrico real, y
// una mezcla al 100 % de reverb no es una sugerencia, es un error de formato del modelo.

import { z } from "zod";

export const mixFilterTypes = [
  "peak",
  "low_shelf",
  "high_shelf",
  "high_pass",
  "low_pass",
] as const;

export const mixBandSchema = z.object({
  band: z.number().int().positive(),
  frequencyHz: z.number().min(20).max(20_000),
  gainDb: z.number().min(-24).max(24),
  q: z.number().min(0.1).max(18),
  filterType: z.enum(mixFilterTypes),
  description: z.string().min(1),
});

export const mixEqSchema = z.object({
  bands: z.array(mixBandSchema).max(8),
  description: z.string().min(1),
});

export const mixReverbSchema = z.object({
  type: z.enum(["plate", "hall", "room", "none"]),
  timeMs: z.number().min(0).max(10_000),
  preDelayMs: z.number().min(0).max(200),
  mixPercent: z.number().min(0).max(60),
  description: z.string().min(1),
});

// Compresión: el MVP no la traía y es la mitad de lo que un operador espera de un channel strip.
// `ratio` arranca en 1 (sin compresión) para que el modelo pueda decir "esta fuente no la toques"
// sin tener que omitir el bloque entero.
export const mixCompressionSchema = z.object({
  thresholdDb: z.number().min(-60).max(0),
  ratio: z.number().min(1).max(20),
  attackMs: z.number().min(0.1).max(200),
  releaseMs: z.number().min(5).max(2000),
  makeupGainDb: z.number().min(0).max(24),
  description: z.string().min(1),
});

export const instrumentMixSchema = z.object({
  /** El id del nodo de la escena. Se comprueba contra el grafo antes de pintar nada. */
  instrumentId: z.string().min(1),
  instrumentName: z.string().min(1),
  eq: mixEqSchema,
  reverb: mixReverbSchema,
  compression: mixCompressionSchema,
});

export const mixAdviceSchema = z.object({
  roomEq: mixEqSchema,
  instruments: z.array(instrumentMixSchema).max(24),
  summary: z.string().min(1),
});

export type MixBand = z.infer<typeof mixBandSchema>;
export type MixEq = z.infer<typeof mixEqSchema>;
export type MixReverb = z.infer<typeof mixReverbSchema>;
export type MixCompression = z.infer<typeof mixCompressionSchema>;
export type InstrumentMix = z.infer<typeof instrumentMixSchema>;
export type MixAdvice = z.infer<typeof mixAdviceSchema>;

export type ParseMixAdviceResult =
  | { ok: true; data: MixAdvice }
  | { ok: false; message: string };

/** El modelo suele envolver el JSON en un bloque markdown; se le quita antes de validar. */
export function parseMixAdvice(raw: string): ParseMixAdviceResult {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "");

  let candidate: unknown;
  try {
    candidate = JSON.parse(cleaned);
  } catch {
    return { ok: false, message: "La IA no devolvió JSON válido." };
  }

  const parsed = mixAdviceSchema.safeParse(candidate);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join(".");
    return {
      ok: false,
      message: path ? `${path}: ${issue.message}` : "Respuesta fuera de rango.",
    };
  }
  return { ok: true, data: parsed.data };
}
