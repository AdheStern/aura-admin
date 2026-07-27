// src/types/action-result.ts — envelope de retorno para Server Actions (Sección 9.6 del doc maestro)

export type ActionErrorCode =
  | "UNAUTHENTICATED"
  | "ACCOUNT_INACTIVE"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "USER_NOT_FOUND"
  | "UNKNOWN";

export type ActionError = { code: ActionErrorCode; message: string };

export type ActionResult<T = void> = T extends void
  ? { ok: true } | { ok: false; error: ActionError }
  : { ok: true; data: T } | { ok: false; error: ActionError };
