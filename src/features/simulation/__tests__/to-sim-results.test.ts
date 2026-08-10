// src/features/simulation/__tests__/to-sim-results.test.ts — el reparto en filas SimResult.
// Se ejerce contra canon-01.expected.json, que es el mismo resultado que entrega el motor.

import { describe, expect, it } from "vitest";
import { type SimulationResult, simulationResultSchema } from "@/contracts";
import canonExpected from "@/contracts/fixtures/canon-01.expected.json";
import {
  type ResultKind,
  toSimResults,
} from "@/features/simulation/model/to-sim-results";

const CANON = simulationResultSchema.parse(canonExpected);

function kinds(result: SimulationResult): ResultKind[] {
  return toSimResults(result).map((row) => row.kind);
}

describe("toSimResults", () => {
  it("siempre produce SUMMARY, con meta dentro y sin los mapas por banda", () => {
    const [summary] = toSimResults(CANON);
    const value = summary.summary as Record<string, unknown>;

    expect(summary.kind).toBe("SUMMARY");
    expect(value.meta).toEqual(CANON.meta);
    expect(value.splTotalDb).toBe(CANON.summary.splTotalDb);
    expect(value.rt60).toBeUndefined();
    expect(summary.payload).toBeNull();
  });

  it("separa los mapas por banda en RT_BANDS", () => {
    const bands = toSimResults(CANON).find((row) => row.kind === "RT_BANDS");
    const value = bands?.summary as Record<string, unknown>;

    expect(value.rt60).toEqual(CANON.summary.rt60);
  });

  it("una métrica que el motor no calculó no genera fila", () => {
    const withoutBands: SimulationResult = {
      ...CANON,
      summary: { splTotalDb: 100 },
      grids: undefined,
      alerts: [],
      recommendations: [],
    };

    expect(kinds(withoutBands)).toEqual(["SUMMARY"]);
  });

  it("la grilla de SPL va al payload y su recuento de puntos al summary", () => {
    const grid = { points: [[0, 0, 1.2] as [number, number, number]] };
    const rows = toSimResults({ ...CANON, grids: { spl: grid } });
    const spl = rows.find((row) => row.kind === "SPL_GRID");

    expect(spl?.summary).toEqual({ points: 1 });
    expect(spl?.payload).toEqual({ spl: grid, cancellation: undefined });
  });

  it("c50 y c80 comparten la fila CLARITY_GRID", () => {
    const grid = { points: [[0, 0, 1.2] as [number, number, number]] };
    const rows = toSimResults({ ...CANON, grids: { c50: grid, c80: grid } });

    expect(rows.filter((row) => row.kind === "CLARITY_GRID")).toHaveLength(1);
  });

  it("RECOMMENDATIONS guarda el índice aparte de la evidencia completa", () => {
    const recommendation = {
      id: "reco_1",
      rule: "RoomModeRule",
      priority: 1,
      action: { type: "parametric_eq" },
      evidence: { centerFrequencyHz: 58.2 },
      text: "…",
    };
    const rows = toSimResults({ ...CANON, recommendations: [recommendation] });
    const reco = rows.find((row) => row.kind === "RECOMMENDATIONS");

    expect(reco?.summary).toEqual([
      { id: "reco_1", rule: "RoomModeRule", priority: 1 },
    ]);
    expect(reco?.payload).toEqual([recommendation]);
  });
});
