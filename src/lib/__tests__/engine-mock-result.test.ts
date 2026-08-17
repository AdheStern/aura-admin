// src/lib/__tests__/engine-mock-result.test.ts
//
// El riesgo de un mock enriquecido es que devuelva algo que el motor real nunca devolvería: en
// cuanto deja de satisfacer el contrato, todo lo que se pruebe encima deja de significar nada.
// Por eso lo primero que se comprueba aquí es el schema.

import { describe, expect, it } from "vitest";
import {
  type SimulationRequest,
  type SimulationResult,
  simulationRequestSchema,
  simulationResultSchema,
} from "@/contracts";
import canonExpected from "@/contracts/fixtures/canon-01.expected.json";
import canonRequest from "@/contracts/fixtures/canon-01.request.json";
import { fullMockResult } from "@/lib/engine-mock-result";

const BASE = simulationResultSchema.parse(canonExpected) as SimulationResult;

function requestWith(
  overrides: Record<string, unknown> = {},
): SimulationRequest {
  return simulationRequestSchema.parse({
    ...canonRequest,
    config: { ...canonRequest.config, ...overrides },
  });
}

describe("fullMockResult", () => {
  it("sigue satisfaciendo el contrato de salida", () => {
    expect(
      simulationResultSchema.safeParse(fullMockResult(requestWith(), BASE))
        .success,
    ).toBe(true);
  });

  it("deriva la grilla de la sala recibida, no de una fija", () => {
    const { grids } = fullMockResult(requestWith(), BASE);
    const grid = grids?.spl;

    // CANON-01 mide 20 × 12 con paso 1 m: 240 celdas, centradas en la celda.
    expect(grid?.points).toHaveLength(240);
    expect(grid?.points[0]).toEqual([0.5, 0.5, 1.2]);
    expect(grid?.valuesDbA).toHaveLength(240);
  });

  it("respeta el paso que pide la config", () => {
    const request = requestWith({ grid: { resolutionM: 2, earHeightM: 1.2 } });
    // 20/2 × 12/2 = 60.
    expect(fullMockResult(request, BASE).grids?.spl.points).toHaveLength(60);
  });

  it("los escalares del summary salen de esa misma grilla", () => {
    const { summary, grids } = fullMockResult(requestWith(), BASE);
    const values = grids?.spl.valuesDbA ?? [];

    // Si no cuadraran, el mapa y las cifras de arriba contarían cosas distintas de la misma sala.
    expect(summary.splMaxDb).toBeCloseTo(Math.max(...values), 2);
    expect(summary.splMinDb).toBeCloseTo(Math.min(...values), 2);
    expect(summary.splSigmaDb).toBeGreaterThan(0);
  });

  it("sin objetivo de RT60 no propone tratamiento", () => {
    const { recommendations } = fullMockResult(
      requestWith({ rtTargetS: null }),
      BASE,
    );

    // Igual que el motor: RtTargetRule no evalúa nada con `null` (ADR 0003), así que un mock que
    // recomendara tratamiento sin objetivo enseñaría una pantalla que la app nunca produce.
    expect(recommendations.map((item) => item.rule)).toEqual([
      "CoverageGapRule",
    ]);
  });

  it("con objetivo añade la recomendación de absorción", () => {
    const { recommendations } = fullMockResult(
      requestWith({ rtTargetS: [1.0, 1.6] }),
      BASE,
    );

    expect(recommendations.map((item) => item.rule)).toEqual([
      "CoverageGapRule",
      "RtTargetRule",
    ]);
    expect(recommendations[1].action.targetRtS).toBe(1.6);
  });

  it("no toca los escalares de CANON-01 que no dependen de la grilla", () => {
    const { summary } = fullMockResult(requestWith(), BASE);

    expect(summary.rt60SabineS).toBe(BASE.summary.rt60SabineS);
    expect(summary.criticalDistanceM).toBe(BASE.summary.criticalDistanceM);
  });
});
