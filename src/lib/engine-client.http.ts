// src/lib/engine-client.http.ts — cliente real del motor: POST /v1/simulations firmado con HMAC.
// Solo encola. El resultado y el progreso vuelven por /api/internal/jobs/:jobId (ver el README de
// aura-engine, sección "Flujo completo de un job").

import { engineErrorEnvelopeSchema, type SimulationRequest } from "@/contracts";
import {
  type EngineClient,
  EngineSubmitError,
} from "@/lib/engine-client.types";
import {
  SIGNATURE_HEADER,
  signEngineBody,
  TIMESTAMP_HEADER,
} from "@/lib/engine-signature";

export function createHttpEngineClient(
  baseUrl: string,
  secret: string,
): EngineClient {
  return {
    async submitSimulation(request: SimulationRequest) {
      // Se serializa UNA vez y se firma sobre estos mismos bytes. Reserializar para firmar
      // cambiaría el orden de claves y la firma no cuadraría nunca.
      const body = JSON.stringify(request);
      const { timestamp, signature } = signEngineBody(body, secret);

      const response = await post(baseUrl, body, {
        "Content-Type": "application/json",
        [TIMESTAMP_HEADER]: timestamp,
        [SIGNATURE_HEADER]: signature,
      });

      if (!response.ok) {
        throw await toSubmitError(response);
      }
    },
  };
}

async function post(
  baseUrl: string,
  body: string,
  headers: Record<string, string>,
): Promise<Response> {
  const url = `${baseUrl.replace(/\/$/, "")}/v1/simulations`;
  try {
    return await fetch(url, {
      method: "POST",
      body,
      headers,
      cache: "no-store",
    });
  } catch (cause) {
    throw new EngineSubmitError(
      "ENGINE_UNREACHABLE",
      `no se pudo hablar con el motor en ${url}`,
      { cause: String(cause) },
    );
  }
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
