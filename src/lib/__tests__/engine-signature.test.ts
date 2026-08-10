// src/lib/__tests__/engine-signature.test.ts — paridad con el HMAC del motor.
// El vector lo genera el propio app/signing.py del motor: si estos hexadecimales dejan de
// cuadrar, los dos lados han divergido y ningún callback volverá a verificar.

import { afterEach, describe, expect, it, vi } from "vitest";
import vectors from "@/lib/__tests__/fixtures/engine-signature-vectors.json";
import { signEngineBody, verifyEngineSignature } from "@/lib/engine-signature";

/** Los vectores llevan su propio timestamp, así que hay que situarse en su momento. */
function at(timestamp: string, offsetS = 0): void {
  vi.useFakeTimers();
  vi.setSystemTime((Number(timestamp) + offsetS) * 1000);
}

afterEach(() => {
  vi.useRealTimers();
});

describe("engine-signature", () => {
  it.each(vectors)("reproduce la firma de Python — $name", (vector) => {
    at(vector.timestamp);

    const verified = verifyEngineSignature(
      vector.body,
      { timestamp: vector.timestamp, signature: vector.signature },
      vector.secret,
    );

    expect(verified).toBe(true);
  });

  it("lo que firma la app lo verifica la app", () => {
    const body = '{"jobId":"job_1"}';
    const signed = signEngineBody(body, "secreto");

    expect(verifyEngineSignature(body, signed, "secreto")).toBe(true);
  });

  it("rechaza un body alterado, aunque sea equivalente como JSON", () => {
    const signed = signEngineBody('{"a":1,"b":2}', "secreto");

    expect(verifyEngineSignature('{"b":2,"a":1}', signed, "secreto")).toBe(
      false,
    );
  });

  it("rechaza otro secreto", () => {
    const body = '{"progress":10}';
    const signed = signEngineBody(body, "secreto");

    expect(verifyEngineSignature(body, signed, "otro")).toBe(false);
  });

  it("rechaza cuando faltan las cabeceras", () => {
    const body = '{"progress":10}';

    expect(
      verifyEngineSignature(body, { timestamp: null, signature: null }, "s"),
    ).toBe(false);
  });

  it("rechaza un timestamp que no es entero", () => {
    const body = '{"progress":10}';
    const { signature } = signEngineBody(body, "s");

    expect(
      verifyEngineSignature(body, { timestamp: "ayer", signature }, "s"),
    ).toBe(false);
  });

  // La ventana es de ±300 s y es simétrica: un reloj adelantado también se rechaza.
  it.each([
    { offsetS: 300, valid: true, label: "justo en el borde" },
    { offsetS: 301, valid: false, label: "un segundo tarde" },
    { offsetS: -301, valid: false, label: "un segundo adelantado" },
  ])("ventana de reenvío — $label", ({ offsetS, valid }) => {
    const [vector] = vectors;
    at(vector.timestamp, offsetS);

    const verified = verifyEngineSignature(
      vector.body,
      { timestamp: vector.timestamp, signature: vector.signature },
      vector.secret,
    );

    expect(verified).toBe(valid);
  });
});
