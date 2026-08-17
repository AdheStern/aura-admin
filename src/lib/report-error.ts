// src/lib/report-error.ts — el único sitio por donde sale un fallo inesperado.
//
// Existe por lo que viene después, no por lo que hace hoy: hoy escribe una línea de log, y el día
// que haya despliegue y un servicio de errores (Sentry, §12) conectarlo es añadir una llamada AQUÍ
// en vez de recorrer treinta `catch` repartidos por el código.
//
// Lo que sí está resuelto desde ya —y es lo que de verdad importa de esta capa— es que nada de lo
// que se reporte lleve secretos: el contexto pasa por scrubSecrets antes de escribirse. Un reporte
// de errores es justo el sitio donde una API key de usuario viaja fuera sin que nadie lo mire.

import type { LogFields } from "@/lib/logger";
import { logger } from "@/lib/logger";

export function reportError(error: unknown, context: LogFields = {}): void {
  logger.error(messageOf(error), { ...context, error });
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "error desconocido";
}
