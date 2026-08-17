// src/lib/__tests__/scrub-secrets.test.ts
//
// La §10 dice que las API keys de los usuarios "jamás se loggean". Esto es lo que hace de esa frase
// algo comprobable. La misma clave se mete por tres caminos distintos —dentro del payload, dentro
// del mensaje de un Error y bajo un nombre de campo inocente— porque un scrubbing que solo mira
// nombres de clave tapa el primero y deja pasar los otros dos.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { logger } from "@/lib/logger";
import { reportError } from "@/lib/report-error";
import { scrubSecrets } from "@/lib/scrub-secrets";

const USER_API_KEY = "sk-ant-clave-de-un-usuario-real-0001";
const SHARED_SECRET = "secreto-compartido-con-el-motor";

beforeEach(() => {
  process.env.ENGINE_SHARED_SECRET = SHARED_SECRET;
});

afterEach(() => {
  process.env.ENGINE_SHARED_SECRET = undefined;
});

/** Captura lo que el logger escribe, para poder asertar la línea entera. */
function captureOutput(run: () => void): string {
  const written: string[] = [];
  const original = { out: process.stdout.write, err: process.stderr.write };

  process.stdout.write = ((chunk: string) => {
    written.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = process.stdout.write;

  try {
    run();
  } finally {
    process.stdout.write = original.out;
    process.stderr.write = original.err;
  }

  return written.join("");
}

describe("scrubSecrets", () => {
  it("tacha por nombre de campo, sin importar cómo esté escrito", () => {
    const scrubbed = scrubSecrets({
      apiKey: USER_API_KEY,
      api_key: USER_API_KEY,
      Authorization: "Bearer xyz",
      "X-Signature": "abc",
      llmApiKeyCipher: "base64…",
      inocente: "esto se queda",
    }) as Record<string, unknown>;

    expect(JSON.stringify(scrubbed)).not.toContain(USER_API_KEY);
    expect(scrubbed.Authorization).toBe("[redactado]");
    expect(scrubbed["X-Signature"]).toBe("[redactado]");
    expect(scrubbed.llmApiKeyCipher).toBe("[redactado]");
    expect(scrubbed.inocente).toBe("esto se queda");
  });

  it("tacha por valor un secreto del entorno bajo un nombre cualquiera", () => {
    // La red que salva cuando alguien reempaqueta los datos por el camino y el campo pierde su
    // nombre delator.
    const scrubbed = scrubSecrets({ detalle: `firma=${SHARED_SECRET}` });

    expect(JSON.stringify(scrubbed)).not.toContain(SHARED_SECRET);
    expect(scrubbed).toEqual({ detalle: "firma=[redactado]" });
  });

  it("baja hasta el fondo de un payload anidado", () => {
    const request = {
      jobId: "job_1",
      llm: { provider: "anthropic", apiKey: USER_API_KEY, enabled: true },
      sources: [{ spec: { nested: { apiKey: USER_API_KEY } } }],
    };

    expect(JSON.stringify(scrubSecrets(request))).not.toContain(USER_API_KEY);
  });

  it("conserva la parte útil del mensaje en vez de tirarlo entero", () => {
    const scrubbed = scrubSecrets(
      `no se pudo conectar con ${SHARED_SECRET} desde el motor`,
    ) as string;

    expect(scrubbed).toBe("no se pudo conectar con [redactado] desde el motor");
  });

  it("un objeto circular no cuelga el proceso", () => {
    const circular: Record<string, unknown> = { name: "raíz" };
    circular.self = circular;

    // Un log no puede tumbar la petición que estaba describiendo.
    expect(() => scrubSecrets(circular)).not.toThrow();
    expect(JSON.stringify(scrubSecrets(circular))).toContain("[circular]");
  });

  it("no se inventa redacciones con un secreto vacío o cortísimo", () => {
    process.env.ENGINE_SHARED_SECRET = "abc";

    // Con un secreto de tres letras, tachar por valor destrozaría cualquier texto que las contenga.
    expect(scrubSecrets("abcdefg")).toBe("abcdefg");
  });

  it("reconoce una clave de usuario por su forma, esté donde esté", () => {
    // Esta es la única red que la atrapa fuera de su campo: la clave de un usuario no está en el
    // entorno —vive cifrada en la BD— así que las otras dos no la reconocerían.
    expect(scrubSecrets({ traza: USER_API_KEY })).toEqual({
      traza: "[redactado]",
    });
    expect(scrubSecrets("falló con AIzaSyD-1234567890abcdefghij")).toBe(
      "falló con [redactado]",
    );
  });

  it("no confunde texto normal con una clave", () => {
    const inocente = "el sk- del proveedor y AIza sueltos no son claves";
    expect(scrubSecrets(inocente)).toBe(inocente);
  });
});

describe("logger y reportError", () => {
  it("la línea es JSON con nivel, mensaje y campos", () => {
    const output = captureOutput(() =>
      logger.info("job encolado", { jobId: "job_1" }),
    );

    expect(JSON.parse(output)).toMatchObject({
      level: "info",
      message: "job encolado",
      jobId: "job_1",
    });
  });

  it("la clave no sobrevive por ninguno de los tres caminos", () => {
    const output = captureOutput(() =>
      reportError(new Error(`el proveedor rechazó ${SHARED_SECRET}`), {
        jobId: "job_1",
        request: { llm: { apiKey: USER_API_KEY } },
        traza: USER_API_KEY,
      }),
    );

    expect(output).not.toContain(USER_API_KEY);
    expect(output).not.toContain(SHARED_SECRET);
    // Y lo que no es secreto sigue estando, que es lo que hace útil el reporte.
    expect(JSON.parse(output)).toMatchObject({
      level: "error",
      jobId: "job_1",
    });
  });

  it("un Error se serializa con nombre, mensaje y traza, no como {}", () => {
    const output = captureOutput(() => reportError(new Error("se rompió")));
    const line = JSON.parse(output);

    // JSON.stringify de un Error da "{}" y el reporte no diría nada.
    expect(line.error).toMatchObject({ name: "Error", message: "se rompió" });
    expect(line.error.stack).toContain("se rompió");
  });
});
