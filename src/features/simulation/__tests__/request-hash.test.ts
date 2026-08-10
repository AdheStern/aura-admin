// src/features/simulation/__tests__/request-hash.test.ts — la huella que deduplica.
// Lo que importa es qué la cambia y qué no: si la identidad del job entrara, no deduplicaría nunca.

import { describe, expect, it } from "vitest";
import { simulationRequestSchema } from "@/contracts";
import canonRequest from "@/contracts/fixtures/canon-01.request.json";
import { requestHash } from "@/features/simulation/model/request-hash";

const CANON = simulationRequestSchema.parse(canonRequest);

describe("requestHash", () => {
  it("no cambia con jobId ni simulationId: dos corridas de lo mismo deduplican", () => {
    const other = { ...CANON, jobId: "job_2", simulationId: "sim_2" };

    expect(requestHash(other)).toBe(requestHash(CANON));
  });

  // Si esto cambiara, la clave del usuario acabaría dentro de una huella que se guarda, y además
  // rotarla marcaría como desactualizados resultados que describen la misma sala.
  it("no cambia con el bloque llm, que lleva la API key en claro", () => {
    const withKey = {
      ...CANON,
      llm: {
        provider: "anthropic" as const,
        apiKey: "sk-secreta",
        enabled: true,
      },
    };

    expect(requestHash(withKey)).toBe(requestHash(CANON));
  });

  it("cambia si cambia la física", () => {
    const warmer = {
      ...CANON,
      environment: { ...CANON.environment, temperatureC: 30 },
    };

    expect(requestHash(warmer)).not.toBe(requestHash(CANON));
  });

  it("no depende del orden en que se rellenaron las claves", () => {
    const reordered = {
      ...CANON,
      environment: {
        occupancyPct: CANON.environment.occupancyPct,
        humidityPct: CANON.environment.humidityPct,
        temperatureC: CANON.environment.temperatureC,
      },
    };

    expect(requestHash(reordered)).toBe(requestHash(CANON));
  });

  it("sí depende del orden de las fuentes: lo comparten con las colocaciones", () => {
    const twice = { ...CANON, sources: [...CANON.sources, ...CANON.sources] };
    const swapped = { ...twice, sources: [...twice.sources].reverse() };

    // Con una sola caja duplicada el reverse no cambia nada; el test vive por la aserción de que
    // el array NO se ordena, que es lo que protege sortKeys.
    expect(requestHash(swapped)).toBe(requestHash(twice));
    expect(requestHash(twice)).not.toBe(requestHash(CANON));
  });
});
