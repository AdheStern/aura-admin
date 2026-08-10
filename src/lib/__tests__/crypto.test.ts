// src/lib/__tests__/crypto.test.ts — el cifrado en reposo de las claves del usuario.
//
// Lo que se comprueba es lo que hace inútil un cifrado mal hecho: que dos cifrados del mismo texto
// no salgan iguales (IV reutilizado) y que un texto manipulado no descifre (GCM sin autenticar).

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "@/lib/crypto";

const KEY = Buffer.alloc(32, 7).toString("base64");
const OTHER_KEY = Buffer.alloc(32, 9).toString("base64");
const SECRET = "sk-ant-api03-ejemplo-de-clave";

beforeEach(() => {
  process.env.APP_ENCRYPTION_KEY = KEY;
});

afterEach(() => {
  process.env.APP_ENCRYPTION_KEY = KEY;
});

describe("encryptSecret / decryptSecret", () => {
  it("va y vuelve", () => {
    expect(decryptSecret(encryptSecret(SECRET))).toBe(SECRET);
  });

  it("el mismo texto cifrado dos veces da resultados distintos", () => {
    // Si esto falla es que el IV es fijo, y con GCM eso no solo filtra: permite falsificar.
    expect(encryptSecret(SECRET)).not.toBe(encryptSecret(SECRET));
  });

  it("no descifra con otra clave", () => {
    const payload = encryptSecret(SECRET);
    process.env.APP_ENCRYPTION_KEY = OTHER_KEY;

    expect(decryptSecret(payload)).toBeNull();
  });

  it("un texto manipulado no descifra en vez de devolver basura", () => {
    const raw = Buffer.from(encryptSecret(SECRET), "base64");
    raw[raw.length - 1] ^= 0xff;

    expect(decryptSecret(raw.toString("base64"))).toBeNull();
  });

  it("una etiqueta manipulada tampoco", () => {
    const raw = Buffer.from(encryptSecret(SECRET), "base64");
    raw[13] ^= 0xff;

    expect(decryptSecret(raw.toString("base64"))).toBeNull();
  });

  it("basura de entrada devuelve null, no lanza", () => {
    expect(decryptSecret("esto-no-es-base64-cifrado")).toBeNull();
    expect(decryptSecret("")).toBeNull();
  });

  it("una clave del tamaño equivocado se rechaza al arrancar la operación", () => {
    process.env.APP_ENCRYPTION_KEY = Buffer.alloc(16, 1).toString("base64");

    expect(() => encryptSecret(SECRET)).toThrow(/32 bytes/);
  });

  it("sin clave configurada dice cuál falta", () => {
    process.env.APP_ENCRYPTION_KEY = "";

    expect(() => encryptSecret(SECRET)).toThrow(/APP_ENCRYPTION_KEY/);
  });
});
