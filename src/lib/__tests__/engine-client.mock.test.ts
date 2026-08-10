// src/lib/__tests__/engine-client.mock.test.ts — el motor de loopback y su cancelación.
//
// Importa porque es el modo con el que corren el E2E y el desarrollo local: si aquí cancelar no
// detuviera la entrega, el fallo solo aparecería con el motor real delante.

import { afterEach, describe, expect, it, vi } from "vitest";
import { simulationRequestSchema } from "@/contracts";
import canonRequest from "@/contracts/fixtures/canon-01.request.json";
import { createLoopbackEngineClient } from "@/lib/engine-client.mock";

const SECRET = "test-secret";
const APP_URL = "http://app.test";

function requestWithJob(jobId: string) {
  return simulationRequestSchema.parse({ ...canonRequest, jobId });
}

/** Devuelve las URL a las que el loopback POSTeó. */
function captureFetch(): string[] {
  const urls: string[] = [];
  vi.stubGlobal("fetch", async (url: string) => {
    urls.push(url);
    return new Response("{}", { status: 200 });
  });
  return urls;
}

const flush = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Espera a que se cumpla la condición en vez de a un plazo fijo: el bucle del loopback usa
 *  temporizadores reales y un sleep a ojo hace el test intermitente. */
async function waitFor(done: () => boolean, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!done() && Date.now() < deadline) await flush(10);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loopback", () => {
  it("entrega los latidos y el resultado a las rutas de la app", async () => {
    const urls = captureFetch();
    const client = createLoopbackEngineClient("mock", SECRET, APP_URL, 1);

    await client.submitSimulation(requestWithJob("job_ok"));
    const final = `${APP_URL}/api/internal/jobs/job_ok`;
    await waitFor(() => urls.includes(final));

    expect(urls.filter((url) => url.endsWith("/progress"))).toHaveLength(6);
    expect(urls.at(-1)).toBe(final);
  });

  it("un job que nunca se encoló es desconocido, no cancelable", async () => {
    const client = createLoopbackEngineClient("mock", SECRET, APP_URL, 1);

    expect(await client.cancelSimulation("job_fantasma")).toEqual({
      ok: false,
      reason: "unknown_job",
    });
  });

  // Cancelar es una petición: el bucle se detiene en su siguiente paso, así que en el momento de
  // contestar el job todavía está corriendo. Decir CANCELLED aquí sería adelantarse a los hechos.
  it("responde RUNNING al pedir la cancelación de un job vivo", async () => {
    const urls = captureFetch();
    const client = createLoopbackEngineClient("mock", SECRET, APP_URL, 20);

    await client.submitSimulation(requestWithJob("job_vivo"));
    const outcome = await client.cancelSimulation("job_vivo");

    expect(outcome).toEqual({ ok: true, status: "RUNNING" });
    await flush(200);
    expect(urls).not.toContain(`${APP_URL}/api/internal/jobs/job_vivo`);
  });

  it("cancelado no entrega resultado: la app ya sabe que canceló", async () => {
    const urls = captureFetch();
    const client = createLoopbackEngineClient("mock", SECRET, APP_URL, 20);

    await client.submitSimulation(requestWithJob("job_parado"));
    await client.cancelSimulation("job_parado");
    await flush(300);

    const final = urls.filter((url) => !url.endsWith("/progress"));
    expect(final).toEqual([]);
  });
});
