// src/lib/engine-client.ts — Facade del motor de simulación (Apéndice A.5 del doc maestro)
// ENGINE_MODE=mock (default) evita cualquier llamada de red hacia aura-engine.
// El cliente real (POST /v1/simulations con HMAC) llega en la Fase 5, detrás de esta misma interfaz.

import { createMockEngineClient } from "@/lib/engine-client.mock";
import type { EngineClient } from "@/lib/engine-client.types";

export type {
  EngineClient,
  EngineJobStatus,
  EngineJobUpdate,
} from "@/lib/engine-client.types";

export function getEngineClient(): EngineClient {
  const mode = process.env.ENGINE_MODE ?? "mock";

  if (mode === "mock" || mode === "mock-fail") {
    return createMockEngineClient(mode);
  }

  throw new Error(
    `ENGINE_MODE="${mode}" no soportado todavía — el cliente real llega en la Fase 5.`,
  );
}
