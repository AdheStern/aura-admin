// src/features/catalogs/schemas/parse-spec-json.ts — parseo + mensaje uniforme del JSON de un
// datasheet contra su contrato zod. Se usa en el cliente (feedback inmediato) y en cada action
// (la validación que realmente cuenta — nunca se confía en la del cliente).

import type { z } from "zod";

export type SpecParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export function parseSpecJson<T>(
  schema: z.ZodType<T>,
  raw: string,
): SpecParseResult<T> {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, message: "JSON inválido: revisa la sintaxis" };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join(".");
    return {
      ok: false,
      message: path
        ? `${path}: ${issue.message}`
        : (issue?.message ?? "Datos inválidos"),
    };
  }
  return { ok: true, data: parsed.data };
}
