// src/lib/scrub-secrets.ts — quita secretos de cualquier cosa antes de que se escriba a un log o
// se mande a un reporte de errores.
//
// La §10 lo exige literalmente: "las API keys LLM de usuarios jamás se loggean ni viajan al
// navegador tras guardarse". Y es la fuga silenciosa típica: nadie escribe `console.log(apiKey)`,
// pero sí `logger.error("falló", { request })` con la clave dentro del request.
//
// Tres redes, porque cada una tapa lo que las otras no ven:
//
//   1. POR NOMBRE de clave — cubre lo que se llama como se espera (`apiKey`, `authorization`…).
//   2. POR VALOR conocido — si el string coincide con un secreto del entorno se tacha aunque el
//      campo que lo contiene se llame `foo`. Salva cuando alguien reempaqueta datos por el camino.
//   3. POR FORMA — las claves de los tres proveedores tienen prefijos inconfundibles (`sk-ant-`,
//      `sk-`, `AIza`). Es la única red que atrapa la clave de un USUARIO fuera de su campo: esa no
//      está en el entorno —vive cifrada en la BD y solo se descifra para armar el payload—, así que
//      las otras dos no la reconocerían.
//
// LIMITACIÓN de la tercera: conoce los prefijos de hoy. Un proveedor nuevo con otro formato entra
// sin que nadie se entere, así que la primera red sigue siendo la que manda — `apiKey` está en la
// lista y no puede salir de ella.

const REDACTED = "[redactado]";

/** Fragmentos que, si aparecen en el nombre de la clave, tachan su valor. En minúsculas. */
const SENSITIVE_KEY_PARTS = [
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "password",
  "secret",
  "signature",
  "token",
  "cipher",
  "database_url",
  "connectionstring",
];

/** Nombres de variables de entorno cuyo VALOR no debe aparecer nunca en un log. */
const SENSITIVE_ENV_VARS = [
  "APP_ENCRYPTION_KEY",
  "ENGINE_SHARED_SECRET",
  "BETTER_AUTH_SECRET",
  "CRON_SECRET",
  "DATABASE_URL",
  "GOOGLE_CLIENT_SECRET",
];

/**
 * Prefijos de clave de los tres proveedores del contrato: `sk-ant-` (Anthropic), `sk-` (DeepSeek,
 * y el formato clásico de OpenAI) y `AIza` (Google).
 *
 * El mínimo de 16 caracteres después del prefijo evita destrozar texto normal: "sk-" a secas
 * aparece en cualquier parte, una clave de verdad no baja de treinta.
 */
const API_KEY_SHAPES = /\b(sk-[A-Za-z0-9_-]{16,}|AIza[A-Za-z0-9_-]{16,})\b/g;

const MAX_DEPTH = 6;

export function scrubSecrets(value: unknown): unknown {
  return walk(value, 0, new WeakSet());
}

function walk(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (typeof value === "string") return scrubString(value);
  if (value === null || typeof value !== "object") return value;

  // Un objeto que se referencia a sí mismo colgaría esto, y un log no puede tumbar la petición que
  // estaba describiendo.
  if (depth >= MAX_DEPTH) return "[profundidad máxima]";
  if (seen.has(value)) return "[circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => walk(item, depth + 1, seen));
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: scrubString(value.message),
      stack: value.stack ? scrubString(value.stack) : undefined,
    };
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      isSensitiveKey(key) ? REDACTED : walk(item, depth + 1, seen),
    ]),
  );
}

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-_]/g, "");
  return SENSITIVE_KEY_PARTS.some((part) =>
    normalized.includes(part.replace(/[-_]/g, "")),
  );
}

/**
 * Tacha el secreto DENTRO del texto en vez de tirar el texto entero: una URL de Postgres en un
 * mensaje de error dice cosas útiles aparte de la contraseña, y un mensaje reducido a "[redactado]"
 * no sirve para depurar nada.
 */
function scrubString(text: string): string {
  let scrubbed = text.replace(API_KEY_SHAPES, REDACTED);

  for (const name of SENSITIVE_ENV_VARS) {
    const secret = process.env[name];
    // Los muy cortos se ignoran: un secreto de dos caracteres —o vacío— haría trizas cualquier
    // mensaje que los contenga por casualidad.
    if (secret && secret.length >= 8) {
      scrubbed = scrubbed.split(secret).join(REDACTED);
    }
  }

  return scrubbed;
}
