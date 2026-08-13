// src/features/simulation/schemas/mix-advice-json-schema.ts — la forma del consejo, para el proveedor.
//
// Por qué existe: pedir "responde solo JSON" no basta. Con `responseMimeType: application/json` y
// sin esquema, Gemini corta la respuesta a media llave —informando `finishReason: STOP`, no
// MAX_TOKENS— o repite un fragmento del texto. Falla una de cada tres veces y siempre acaba en el
// mismo sitio: "La IA no devolvió JSON válido". Con el esquema, el descodificador no puede
// terminar una estructura incompleta y el fallo desaparece de raíz.
//
// Se DERIVA de `mixAdviceSchema` en vez de escribirse a mano —mismo `z.toJSONSchema` que usa
// contracts:build— para que no haya dos verdades sobre la forma del consejo. Escribirlo aparte
// significaría que el día que alguien añada un campo, el proveedor siga rellenando el viejo.
//
// Se le quitan dos cosas:
//
//   1. `$defs`/`$ref` — zod los emite al reutilizar `mixBandSchema` y `mixEqSchema`, y el
//      validador de esquemas de Gemini los rechaza con un 400 seco ("invalid argument"). Se
//      inlinean. Es seguro porque el contrato no es recursivo; si algún día lo fuera, esto colgaría.
//   2. Los RANGOS (`minimum`, `maximum`, `maxItems`…). No los admite, y tampoco hacen falta aquí:
//      quien decide si una ganancia de 48 dB es utilizable es `parseMixAdvice`, que sigue validando
//      la respuesta entera. El esquema aporta la ESTRUCTURA; zod sigue aportando el criterio.

import { z } from "zod";
import { mixAdviceSchema } from "@/features/simulation/schemas/mix-advice";

/** Palabras clave que el validador de Gemini no acepta, más las decorativas. */
const UNSUPPORTED = new Set([
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
  "multipleOf",
  "pattern",
  "additionalProperties",
  "$schema",
  "id",
  "title",
]);

/** Estructura del consejo en JSON Schema, sin referencias ni rangos. */
export function mixAdviceJsonSchema(): Record<string, unknown> {
  const root = z.toJSONSchema(mixAdviceSchema, {
    target: "draft-2020-12",
    io: "input",
  }) as Record<string, unknown>;

  const defs = (root.$defs ?? {}) as Record<string, unknown>;
  return inline(root, defs) as Record<string, unknown>;
}

function inline(node: unknown, defs: Record<string, unknown>): unknown {
  if (Array.isArray(node)) return node.map((item) => inline(item, defs));
  if (!node || typeof node !== "object") return node;

  const object = node as Record<string, unknown>;
  if (typeof object.$ref === "string") {
    const name = object.$ref.replace("#/$defs/", "");
    return inline(defs[name], defs);
  }

  return Object.fromEntries(
    Object.entries(object)
      .filter(([key]) => key !== "$defs" && !UNSUPPORTED.has(key))
      .map(([key, value]) => [key, inline(value, defs)]),
  );
}
