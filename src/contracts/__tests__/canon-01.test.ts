// src/contracts/__tests__/canon-01.test.ts — CANON-01 (Apéndice A.1): primera fixture, primer test.
// Si esto no reproduce estos números, el código está mal — no se discute la física.

import { describe, expect, it } from "vitest";
import { simulationRequestSchema, simulationResultSchema } from "@/contracts";
import canonExpected from "@/contracts/fixtures/canon-01.expected.json";
import canonRequest from "@/contracts/fixtures/canon-01.request.json";
import { mockJobUpdates } from "@/lib/engine-client.mock";

describe("CANON-01", () => {
  it("el request y el expected cumplen los contratos v1", () => {
    expect(() => simulationRequestSchema.parse(canonRequest)).not.toThrow();
    expect(() => simulationResultSchema.parse(canonExpected)).not.toThrow();
  });

  it("el motor mock resuelve el ciclo QUEUED→RUNNING→COMPLETED con los valores de A.1", () => {
    const updates = mockJobUpdates("mock");

    expect(updates[0]).toEqual({ status: "QUEUED", progress: 0 });
    expect(updates.at(-1)?.status).toBe("COMPLETED");

    const result = updates.at(-1)?.result;
    expect(result?.summary.splTotalDb).toBe(104.8);
    expect(result?.summary.rt60SabineS).toBe(2.683);
    expect(result?.summary.criticalDistanceM).toBe(3.89);
    expect(result?.meta.validity.schroederHz).toBe(86.3);
  });

  it("ENGINE_MODE=mock-fail entrega un error simulado", () => {
    const updates = mockJobUpdates("mock-fail");

    expect(updates.at(-1)?.status).toBe("FAILED");
    expect(updates.at(-1)?.error?.code).toBe("ENGINE_FAILURE");
  });
});
