// src/lib/engine-callback.ts — puerta de entrada de los callbacks del motor.
//
// En /api/internal no hay sesión ni cookie: el HMAC ES la autorización, y por eso esas rutas están
// excluidas del matcher de src/proxy.ts. Es la excepción documentada a la regla de que todo pase
// por resolveProjectAccess().

import { engineSharedSecret } from "@/lib/engine-env";
import {
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  verifyEngineSignature,
} from "@/lib/engine-signature";

/**
 * Devuelve el body EXACTO que llegó si la firma cuadra, o null si no.
 *
 * TRAMPA: hay que verificar sobre este texto y parsear después. Un JSON.parse + JSON.stringify
 * antes de verificar reordena las claves y ninguna firma cuadraría jamás.
 */
export async function readSignedCallback(
  request: Request,
): Promise<string | null> {
  const rawBody = await request.text();

  const verified = verifyEngineSignature(
    rawBody,
    {
      timestamp: request.headers.get(TIMESTAMP_HEADER),
      signature: request.headers.get(SIGNATURE_HEADER),
    },
    engineSharedSecret(),
  );

  return verified ? rawBody : null;
}

export function unauthorized(): Response {
  // Mismo cuerpo que usa el motor cuando rechaza una firma: ninguno de los seis códigos del
  // contrato describe un fallo de autenticación (ADR 0009).
  return Response.json({ detail: "unauthorized" }, { status: 401 });
}
