// src/lib/engine-env.ts — configuración del motor, leída y validada en un solo sitio.
// El motor valida la suya al importar para fallar al arrancar y no en mitad de un job; aquí no se
// puede hacer lo mismo (Next importa este módulo en rutas que quizá nunca simulen), pero sí exigir
// la variable en el primer uso y decir exactamente cuál falta.

export type EngineMode = "mock" | "mock-fail" | "http";

const MODES: readonly EngineMode[] = ["mock", "mock-fail", "http"];

export function engineMode(): EngineMode {
  const mode = process.env.ENGINE_MODE ?? "mock";
  if (!MODES.includes(mode as EngineMode)) {
    throw new Error(
      `ENGINE_MODE="${mode}" no existe. Usa uno de: ${MODES.join(" | ")}.`,
    );
  }
  return mode as EngineMode;
}

/**
 * El mismo string que ENGINE_SHARED_SECRET en el .env del motor. Hace falta en los tres modos:
 * también el loopback firma sus callbacks, para que mock y http recorran el mismo camino.
 */
export function engineSharedSecret(): string {
  return required("ENGINE_SHARED_SECRET");
}

export function engineUrl(): string {
  return required("ENGINE_URL");
}

/** Origen de esta app, al que el loopback se devuelve los callbacks. */
export function appUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000"
  );
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta ${name} en el entorno (ver .env.example).`);
  }
  return value;
}
