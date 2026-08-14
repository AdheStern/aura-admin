// src/features/simulation/schemas/mix-advice-json-schema.ts — la forma del consejo de mezcla, para
// el proveedor.
//
// La conversión y el porqué —qué se le quita al esquema y por qué el modo JSON sin él corta las
// respuestas— viven en lib/provider-json-schema.ts, que es lo que también usa el consejo de
// tratamiento acústico. Aquí solo se dice de qué contrato se deriva.

import { mixAdviceSchema } from "@/features/simulation/schemas/mix-advice";
import { toProviderJsonSchema } from "@/lib/provider-json-schema";

/** Estructura del consejo en JSON Schema, sin referencias ni rangos. */
export function mixAdviceJsonSchema(): Record<string, unknown> {
  return toProviderJsonSchema(mixAdviceSchema);
}
