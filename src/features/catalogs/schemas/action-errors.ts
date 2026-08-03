// src/features/catalogs/schemas/action-errors.ts — envelopes de error repetidos en las 15 actions
// de catálogo. Aísla el detalle que más fácil se olvida: una violación de unicidad de Prisma es un
// error de validación del usuario, no una excepción — el doc exige no lanzar nunca al cliente.

import { Prisma } from "@prisma/client";
import type { z } from "zod";
import type { ActionError } from "@/types/action-result";

export function validationError(message: string): {
  ok: false;
  error: ActionError;
} {
  return { ok: false, error: { code: "VALIDATION_ERROR", message } };
}

export function firstIssue(
  error: z.ZodError,
  fallback = "Datos inválidos",
): string {
  return error.issues[0]?.message ?? fallback;
}

/** P2002: colisión con @@unique([brand, model]) al crear o renombrar un ítem. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
