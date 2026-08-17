// src/lib/logger.ts — log estructurado JSON, que es lo que pide la Sección 10.
//
// Una línea JSON por evento y no texto libre: lo que hace depurable un fallo que cruza la frontera
// HTTP es poder filtrar por `jobId` en los dos lados, y para eso el campo tiene que ser un campo,
// no una palabra dentro de una frase. El motor loggea con el mismo criterio.
//
// Sin dependencias: escribe a stdout/stderr, que es de donde cualquier plataforma recoge los logs.
// Todo lo que entra pasa por scrubSecrets antes de salir — un log es exactamente el sitio donde una
// API key se filtra sin que nadie lo note.

import { scrubSecrets } from "@/lib/scrub-secrets";

export type LogFields = Record<string, unknown>;

type Level = "info" | "warn" | "error";

function emit(level: Level, message: string, fields: LogFields): void {
  // El MENSAJE también se limpia, no solo los campos: el texto de un error suele traer dentro lo
  // que lo causó —"el proveedor rechazó <clave>"— y filtrar solo el contexto dejaría pasar justo
  // esa línea.
  const line = JSON.stringify({
    level,
    message: scrubSecrets(message),
    time: new Date().toISOString(),
    ...(scrubSecrets(fields) as LogFields),
  });

  // Los errores por stderr para que la plataforma los separe sin tener que leer el nivel.
  if (level === "error") process.stderr.write(`${line}\n`);
  else process.stdout.write(`${line}\n`);
}

export const logger = {
  info: (message: string, fields: LogFields = {}) =>
    emit("info", message, fields),
  warn: (message: string, fields: LogFields = {}) =>
    emit("warn", message, fields),
  error: (message: string, fields: LogFields = {}) =>
    emit("error", message, fields),
};
