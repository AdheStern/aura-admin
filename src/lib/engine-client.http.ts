// src/lib/engine-client.http.ts — cliente real del motor: encolar y cancelar, firmados con HMAC.
// El resultado y el progreso vuelven por /api/internal/jobs/:jobId (ver el README de aura-engine,
// sección "Flujo completo de un job"); cancelar es el único que responde algo útil en el momento.

import { z } from "zod";
import { engineErrorEnvelopeSchema, type SimulationRequest } from "@/contracts";
import {
  type CancelOutcome,
  type EngineClient,
  type EngineJobStatus,
  EngineSubmitError,
} from "@/lib/engine-client.types";
import {
  SIGNATURE_HEADER,
  signEngineBody,
  TIMESTAMP_HEADER,
} from "@/lib/engine-signature";
import {
  ENGINE_CANCEL_TIMEOUT_MS,
  ENGINE_SUBMIT_TIMEOUT_MS,
} from "@/lib/performance-budget";

const jobStateSchema = z.looseObject({
  status: z.enum(["QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"]),
});

export function createHttpEngineClient(
  baseUrl: string,
  secret: string,
): EngineClient {
  const endpoint = (path: string) => `${baseUrl.replace(/\/$/, "")}${path}`;

  return {
    async submitSimulation(request: SimulationRequest) {
      // Se serializa UNA vez y se firma sobre estos mismos bytes. Reserializar para firmar
      // cambiaría el orden de claves y la firma no cuadraría nunca.
      const url = endpoint("/v1/simulations");
      const response = await send(
        url,
        JSON.stringify(request),
        secret,
        ENGINE_SUBMIT_TIMEOUT_MS,
      );

      if (response === "timeout") {
        throw new EngineSubmitError(
          "TIMEOUT",
          `el motor no aceptó la simulación en ${ENGINE_SUBMIT_TIMEOUT_MS / 1000} s`,
        );
      }
      if (response === "unreachable") {
        throw new EngineSubmitError(
          "ENGINE_UNREACHABLE",
          `no se pudo hablar con el motor en ${url}`,
        );
      }
      if (!response.ok) {
        throw await toSubmitError(response);
      }
    },

    async cancelSimulation(jobId: string): Promise<CancelOutcome> {
      // Cuerpo vacío: el motor lo descarta, pero la ruta va firmada como todas las demás.
      const url = endpoint(
        `/v1/simulations/${encodeURIComponent(jobId)}/cancel`,
      );
      const response = await send(url, "", secret, ENGINE_CANCEL_TIMEOUT_MS);
      // Agotar el tiempo se cuenta como inalcanzable a propósito: no sabemos si el motor recibió
      // la orden, y lo único que no se puede hacer es dar por parado algo que quizá sigue.
      if (typeof response === "string") {
        return { ok: false, reason: "unreachable" };
      }

      if (!response.ok) {
        // Un 400 es "este motor no conoce el job", y entonces seguro que no lo está calculando.
        // Cualquier otro fallo (401 por secreto distinto, 5xx) NO autoriza a suponer eso: darlo por
        // cancelado dejaría a la app diciendo que paró algo que sigue corriendo.
        return {
          ok: false,
          reason: response.status === 400 ? "unknown_job" : "unreachable",
        };
      }

      const state = jobStateSchema.safeParse(await response.json());
      return state.success
        ? { ok: true, status: state.data.status as EngineJobStatus }
        : { ok: false, reason: "unreachable" };
    },
  };
}

/**
 * Un HTTP de error sí devuelve Response; los dos strings son fallos anteriores a tener respuesta.
 *
 * Se separan porque no dicen lo mismo: `unreachable` es que no hay nadie escuchando —conexión
 * rechazada, DNS que no resuelve—, y `timeout` es que el motor aceptó la conexión y se quedó
 * callado, que suele ser un proceso vivo pero atascado. Al usuario le cambia qué mirar.
 */
async function send(
  url: string,
  body: string,
  secret: string,
  timeoutMs: number,
): Promise<Response | "timeout" | "unreachable"> {
  const { timestamp, signature } = signEngineBody(body, secret);
  try {
    return await fetch(url, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
        [TIMESTAMP_HEADER]: timestamp,
        [SIGNATURE_HEADER]: signature,
      },
      cache: "no-store",
      // Sin esto el fetch espera para siempre: un motor que acepta la conexión y no contesta
      // colgaría la server action hasta que la matara la plataforma, sin dejar rastro del porqué.
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    return isTimeout(error) ? "timeout" : "unreachable";
  }
}

/** AbortSignal.timeout aborta con un DOMException llamado TimeoutError, no con un Error propio. */
function isTimeout(error: unknown): boolean {
  return error instanceof Error && error.name === "TimeoutError";
}

async function toSubmitError(response: Response): Promise<EngineSubmitError> {
  const text = await response.text();

  // El 401 es el único que NO trae el envelope: ninguno de los seis códigos del contrato describe
  // un fallo de autenticación, así que el motor responde {"detail": "unauthorized"} a secas
  // (ADR 0009). Intentar parsearlo como envelope solo daría un error de parseo por otro de auth.
  if (response.status === 401) {
    return new EngineSubmitError(
      "UNAUTHORIZED",
      "el motor rechazó la firma: revisa que ENGINE_SHARED_SECRET sea el mismo en ambos lados",
    );
  }

  const envelope = engineErrorEnvelopeSchema.safeParse(safeJson(text));
  if (!envelope.success) {
    return new EngineSubmitError(
      "ENGINE_FAILURE",
      `respuesta ${response.status} ilegible del motor`,
      { body: text.slice(0, 500) },
    );
  }

  const { code, message, details } = envelope.data.error;
  return new EngineSubmitError(code, message, details);
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
