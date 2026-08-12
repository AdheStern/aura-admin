// src/lib/__tests__/engine-client.http.test.ts
//
// Lo que estos tests vigilan es un `fetch` sin `signal`: si el motor acepta la conexión y se queda
// callado, la server action espera para siempre y la mata la plataforma, sin dejar el job en
// FAILED ni un mensaje que explique nada. Aquí se comprueba que el techo va puesto y que un
// plantón no se confunde con un motor apagado, porque no se arreglan igual.

import { afterEach, describe, expect, it, vi } from "vitest";
import type { SimulationRequest } from "@/contracts";
import canonRequest from "@/contracts/fixtures/canon-01.request.json";
import { createHttpEngineClient } from "@/lib/engine-client.http";
import { EngineSubmitError } from "@/lib/engine-client.types";
import { ENGINE_SUBMIT_TIMEOUT_MS } from "@/lib/performance-budget";

const REQUEST = canonRequest as unknown as SimulationRequest;

const client = () => createHttpEngineClient("http://motor.test", "s3cr3t");

function stubFetch(impl: typeof fetch) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

/** Lo que lanza AbortSignal.timeout: un DOMException cuyo `name` es TimeoutError. */
function timeoutError(): Error {
  const error = new Error("The operation was aborted due to timeout");
  error.name = "TimeoutError";
  return error;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createHttpEngineClient", () => {
  it("manda un AbortSignal vivo en cada petición", async () => {
    let signal: AbortSignal | null | undefined;
    stubFetch(async (_url, init) => {
      signal = init?.signal;
      return new Response(null, { status: 202 });
    });

    await client().submitSimulation(REQUEST);

    expect(signal).toBeInstanceOf(AbortSignal);
    // Vivo al salir: si llegara ya abortado, el techo no estaría midiendo esta petición.
    expect(signal?.aborted).toBe(false);
  });

  it("un plantón del motor es TIMEOUT y dice cuánto esperó", async () => {
    stubFetch(async () => {
      throw timeoutError();
    });

    const error = await client()
      .submitSimulation(REQUEST)
      .catch((thrown) => thrown);

    expect(error).toBeInstanceOf(EngineSubmitError);
    expect(error.code).toBe("TIMEOUT");
    expect(error.message).toContain(`${ENGINE_SUBMIT_TIMEOUT_MS / 1000} s`);
  });

  it("no poder conectar es ENGINE_UNREACHABLE, no TIMEOUT", async () => {
    stubFetch(async () => {
      throw new TypeError("fetch failed");
    });

    const error = await client()
      .submitSimulation(REQUEST)
      .catch((thrown) => thrown);

    expect(error.code).toBe("ENGINE_UNREACHABLE");
  });

  it("un 401 no trae envelope y se traduce sin intentar parsearlo (ADR 0009)", async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ detail: "unauthorized" }), {
          status: 401,
        }),
    );

    const error = await client()
      .submitSimulation(REQUEST)
      .catch((thrown) => thrown);

    expect(error.code).toBe("UNAUTHORIZED");
  });

  it("un envelope del contrato conserva su código y sus detalles", async () => {
    stubFetch(
      async () =>
        new Response(
          JSON.stringify({
            error: {
              code: "INVALID_PAYLOAD",
              message: "config.rtTargetS invertido",
              details: { loc: ["config", "rtTargetS"] },
            },
          }),
          { status: 400 },
        ),
    );

    const error = await client()
      .submitSimulation(REQUEST)
      .catch((thrown) => thrown);

    expect(error.code).toBe("INVALID_PAYLOAD");
    expect(error.details).toEqual({ loc: ["config", "rtTargetS"] });
  });

  it("cancelar con plantón NO se da por cancelado", async () => {
    stubFetch(async () => {
      throw timeoutError();
    });

    // Es la lectura conservadora: decir "cancelado" de algo que quizá sigue calculando deja a la
    // app afirmando que paró un job que el motor no paró.
    expect(await client().cancelSimulation("job-1")).toEqual({
      ok: false,
      reason: "unreachable",
    });
  });

  it("cancelar un job que el motor no conoce es unknown_job, no un fallo de red", async () => {
    stubFetch(async () => new Response("{}", { status: 400 }));

    expect(await client().cancelSimulation("job-1")).toEqual({
      ok: false,
      reason: "unknown_job",
    });
  });

  it("cancelar devuelve el estado del motor en ese momento", async () => {
    stubFetch(async () => new Response(JSON.stringify({ status: "RUNNING" })));

    expect(await client().cancelSimulation("job-1")).toEqual({
      ok: true,
      status: "RUNNING",
    });
  });
});
