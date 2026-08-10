// src/lib/engine-signature.ts — HMAC compartido con el motor (espejo de su app/signing.py).
// Firma los dos sentidos: la app firma lo que envía a /v1/simulations, y el motor firma los
// callbacks que la app recibe. Cualquier divergencia con signing.py rompe el ciclo entero, así
// que los tests comparan contra un vector generado por el propio Python.
//
// El timestamp entra en la firma. Firmar solo el body dejaría la ventana de ±5 min sin defender
// de un reenvío: bastaría con reemitir el mismo par body+firma dentro de la ventana (ADR 0009).
//
// TRAMPA: se firma sobre los BYTES que viajan, no sobre el objeto. Si un lado serializa el JSON y
// el otro lo reserializa para firmarlo, el orden de claves cambia y ninguna firma cuadra jamás.

import { createHmac, timingSafeEqual } from "node:crypto";

export const SIGNATURE_HEADER = "X-Signature";
export const TIMESTAMP_HEADER = "X-Timestamp";

/** Ventana de reenvío en segundos. Es MAX_CLOCK_SKEW_S del motor y tiene que seguir siéndolo. */
const MAX_CLOCK_SKEW_S = 300;

export type EngineSignature = { timestamp: string; signature: string };

export function signEngineBody(
  rawBody: string,
  secret: string,
): EngineSignature {
  const timestamp = String(nowSeconds());
  return { timestamp, signature: hmacHex(timestamp, rawBody, secret) };
}

/** Un solo modo de fallo, igual que el motor: no se filtra si cayó la firma o la ventana. */
export function verifyEngineSignature(
  rawBody: string,
  received: { timestamp: string | null; signature: string | null },
  secret: string,
): boolean {
  const { timestamp, signature } = received;
  if (!timestamp || !signature || !isFresh(timestamp)) {
    return false;
  }
  return equalsInConstantTime(signature, hmacHex(timestamp, rawBody, secret));
}

function hmacHex(timestamp: string, rawBody: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
}

function isFresh(timestamp: string): boolean {
  const sent = Number(timestamp);
  return (
    Number.isInteger(sent) && Math.abs(nowSeconds() - sent) <= MAX_CLOCK_SKEW_S
  );
}

function equalsInConstantTime(received: string, expected: string): boolean {
  const left = Buffer.from(received, "utf8");
  const right = Buffer.from(expected, "utf8");
  // timingSafeEqual lanza si los largos difieren, y el largo del hex no es secreto.
  return left.length === right.length && timingSafeEqual(left, right);
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
