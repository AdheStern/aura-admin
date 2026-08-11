// src/lib/engine-client.ts — Facade del motor de simulación (Apéndice A.5 del doc maestro)
// ENGINE_MODE=mock (default) no habla con aura-engine, pero sí con las rutas de callback de esta
// misma app: los tres modos recorren el mismo camino de ingesta.

import { createHttpEngineClient } from "@/lib/engine-client.http";
import { createLoopbackEngineClient } from "@/lib/engine-client.mock";
import type { EngineClient } from "@/lib/engine-client.types";
import {
  appUrl,
  engineMode,
  engineSharedSecret,
  engineUrl,
} from "@/lib/engine-env";

export {
  type EngineClient,
  type EngineJobStatus,
  type EngineJobUpdate,
  EngineSubmitError,
  type JobError,
  type JobErrorCode,
} from "@/lib/engine-client.types";

export function getEngineClient(): EngineClient {
  const mode = engineMode();
  const secret = engineSharedSecret();

  if (mode === "http") {
    return createHttpEngineClient(engineUrl(), secret);
  }

  return createLoopbackEngineClient(mode, secret, appUrl());
}
