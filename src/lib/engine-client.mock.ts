// src/lib/engine-client.mock.ts — motor de loopback (Apéndice A.5 del doc maestro).
// ENGINE_MODE=mock resuelve con canon-01.expected.json; mock-fail simula el camino de error.
// Permite desarrollar y testear sin que aura-engine esté levantado.
//
// No invoca callbacks en memoria: firma y POSTea a las MISMAS rutas /api/internal/jobs/:jobId que
// usa el motor real. Un mock que se saltara esa ingesta escondería justo los bugs que allí viven
// —firma, idempotencia, transiciones de estado— hasta el día del despliegue.

import type { SimulationRequest } from "@/contracts";
import { simulationResultSchema } from "@/contracts";
import canonExpected from "@/contracts/fixtures/canon-01.expected.json";
import type { EngineClient, EngineJobUpdate } from "@/lib/engine-client.types";
import { fullMockResult } from "@/lib/engine-mock-result";
import {
  SIGNATURE_HEADER,
  signEngineBody,
  TIMESTAMP_HEADER,
} from "@/lib/engine-signature";

const MOCK_RESULT = simulationResultSchema.parse(canonExpected);
const PROGRESS_STEPS = [0, 20, 40, 60, 80, 100] as const;

export type MockMode = "mock" | "mock-full" | "mock-fail";

/**
 * La secuencia que el loopback entrega, aparte del transporte, para poder asertarla sin red.
 *
 * `request` solo hace falta en `mock-full`, que deriva su grilla de la sala que le mandaron: sin
 * eso el mapa saldría de otra sala y no cuadraría con el 3D que tiene delante.
 */
export function mockJobUpdates(
  mode: MockMode,
  request?: SimulationRequest,
): EngineJobUpdate[] {
  const running = PROGRESS_STEPS.map<EngineJobUpdate>((progress) => ({
    status: "RUNNING",
    progress,
  }));

  return [
    { status: "QUEUED", progress: 0 },
    ...running,
    lastUpdate(mode, request),
  ];
}

function lastUpdate(
  mode: MockMode,
  request?: SimulationRequest,
): EngineJobUpdate {
  if (mode === "mock-fail") {
    return {
      status: "FAILED",
      progress: 100,
      error: {
        code: "ENGINE_FAILURE",
        message: "Fallo simulado (ENGINE_MODE=mock-fail)",
      },
    };
  }

  const result =
    mode === "mock-full" && request
      ? fullMockResult(request, MOCK_RESULT)
      : MOCK_RESULT;

  return { status: "COMPLETED", progress: 100, result };
}

export function createLoopbackEngineClient(
  mode: MockMode,
  secret: string,
  appUrl: string,
  stepDelayMs = 500,
): EngineClient {
  return {
    async submitSimulation(request) {
      const jobId = request.jobId;
      // Sin await, igual que el 202 del motor: encolar devuelve enseguida y el trabajo sigue
      // aparte. Los fallos se tragan porque un motor tampoco puede avisar a quien ya respondió.
      running.add(jobId);
      void deliver(mode, jobId, secret, appUrl, stepDelayMs, request).catch(
        () => {},
      );
    },

    async cancelSimulation(jobId) {
      if (!running.has(jobId)) return { ok: false, reason: "unknown_job" };

      // Cooperativa como la del motor: se marca la intención y el bucle se detiene en su siguiente
      // paso, así que el estado que se devuelve todavía es RUNNING. Decir CANCELLED aquí sería
      // afirmar como hecho algo que aún no ha pasado.
      cancelled.add(jobId);
      return { ok: true, status: "RUNNING" };
    },
  };
}

// Estado del PROCESO, igual que el store del motor: se pierde al reiniciar, y por eso un job que
// no está aquí se responde como desconocido en vez de inventarle un estado.
const running = new Set<string>();
const cancelled = new Set<string>();

async function deliver(
  mode: MockMode,
  jobId: string,
  secret: string,
  appUrl: string,
  stepDelayMs: number,
  request: SimulationRequest,
): Promise<void> {
  const base = `${appUrl.replace(/\/$/, "")}/api/internal/jobs/${jobId}`;

  try {
    for (const progress of PROGRESS_STEPS) {
      await sleep(stepDelayMs);
      // Cada latido es un punto de cancelación, como en el motor (jobs.py).
      if (cancelled.has(jobId)) return;
      await send(`${base}/progress`, JSON.stringify({ progress }), secret);
    }

    const [last] = mockJobUpdates(mode, request).slice(-1);
    const body = last.result ? last.result : { error: last.error };
    // Una cancelación NO entrega callback: la app ya sabe que canceló porque lo pidió.
    if (!cancelled.has(jobId)) {
      await send(base, JSON.stringify(body), secret);
    }
  } finally {
    running.delete(jobId);
    cancelled.delete(jobId);
  }
}

async function send(url: string, body: string, secret: string): Promise<void> {
  const { timestamp, signature } = signEngineBody(body, secret);
  await fetch(url, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
      [TIMESTAMP_HEADER]: timestamp,
      [SIGNATURE_HEADER]: signature,
    },
    cache: "no-store",
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
