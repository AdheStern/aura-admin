// src/lib/provider-json-schema.ts — un schema de zod convertido a lo que acepta un proveedor de LLM.
//
// Existe porque pedir "responde solo JSON" no basta. Con el modo JSON y sin esquema, Gemini corta
// la respuesta a media llave —informando `finishReason: STOP`, no MAX_TOKENS— o repite un fragmento
// del texto. Fallaba una de cada tres veces. Con el esquema, el descodificador no puede terminar
// una estructura incompleta y el fallo desaparece de raíz.
//
// Se DERIVA del zod, con el mismo `z.toJSONSchema` que usa contracts:build, para que no haya dos
// verdades sobre la forma de la respuesta: el día que alguien añada un campo, el proveedor se entera
// solo. Se le quitan dos cosas:
//
//   1. `$defs`/`$ref` — zod los emite al reutilizar un sub-schema, y el validador de Gemini los
//      rechaza con un 400 seco ("invalid argument"). Se inlinean. Seguro mientras el contrato no sea
//      recursivo; si algún día lo fuera, esto colgaría.
//   2. Los RANGOS (`minimum`, `maximum`, `maxItems`…). No los admite, y tampoco hacen falta: quien
//      decide si una ganancia de 48 dB es utilizable es el zod al validar la respuesta. El esquema
//      aporta la ESTRUCTURA; zod sigue aportando el criterio.

import type { z } from "zod";
import { z as zod } from "zod";

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

export function toProviderJsonSchema(
  schema: z.ZodType,
): Record<string, unknown> {
  const root = zod.toJSONSchema(schema, {
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
