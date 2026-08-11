// src/lib/crypto.ts — cifrado en reposo de los secretos del usuario (ADR-08).
//
// AES-256-GCM y no CBC: GCM autentica además de cifrar, así que un texto manipulado en la BD falla
// al descifrar en vez de devolver basura que acabaría viajando al proveedor del LLM como si fuera
// una clave.
//
// El IV es aleatorio y va DELANTE del texto cifrado, uno nuevo por cada cifrado. Reutilizar un IV
// con la misma clave rompe GCM del todo — no solo filtra el mensaje, permite falsificar etiquetas.
// Por eso no hay forma de pasarlo desde fuera.
//
// Formato: base64(iv ‖ tag ‖ cifrado). Una sola cadena opaca que cabe en una columna de texto y no
// obliga a guardar tres campos que alguien podría acabar mezclando entre filas.

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, appEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}

/** null si el texto no es descifrable: se cambió la clave, o alguien tocó la fila. */
export function decryptSecret(payload: string): string | null {
  try {
    const raw = Buffer.from(payload, "base64");
    const iv = raw.subarray(0, IV_BYTES);
    const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const encrypted = raw.subarray(IV_BYTES + TAG_BYTES);

    const decipher = createDecipheriv(ALGORITHM, appEncryptionKey(), iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final("utf8");
  } catch {
    // Se traga a propósito: distinguir "etiqueta inválida" de "clave equivocada" no le sirve a
    // quien llama y sí a quien sondea.
    return null;
  }
}

/** Para enseñar de qué clave se trata sin enseñarla: "…7bQ2". */
export function secretHint(plaintext: string): string {
  return plaintext.slice(-4);
}

/** Comparación en tiempo constante, para cuando haya que confrontar dos secretos. */
export function secretsMatch(left: string, right: string): boolean {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function appEncryptionKey(): Buffer {
  const configured = process.env.APP_ENCRYPTION_KEY;
  if (!configured) {
    throw new Error(
      "Falta APP_ENCRYPTION_KEY en el entorno (ver .env.example).",
    );
  }

  const key = Buffer.from(configured, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `APP_ENCRYPTION_KEY debe ser ${KEY_BYTES} bytes en base64; llegaron ${key.length}.`,
    );
  }
  return key;
}
