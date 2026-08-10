// src/features/simulation/__tests__/from-sim-results.test.ts — ida y vuelta de las filas SimResult.
//
// Lo que se guarda tiene que poder volver a leerse igual: to-sim-results y from-sim-results son
// inversas, y si dejan de serlo la vista pierde una sección en silencio.

import { describe, expect, it } from "vitest";
import { type SimulationResult, simulationResultSchema } from "@/contracts";
import canonExpected from "@/contracts/fixtures/canon-01.expected.json";
import { fromSimResults } from "@/features/simulation/model/from-sim-results";
import { toSimResults } from "@/features/simulation/model/to-sim-results";

const CANON = simulationResultSchema.parse(canonExpected);

function roundTrip(result: SimulationResult) {
  return fromSimResults(toSimResults(result));
}

describe("fromSimResults", () => {
  it("recupera meta, escalares y bandas de CANON-01", () => {
    const view = roundTrip(CANON);

    expect(view.meta).toEqual(CANON.meta);
    expect(view.scalars.splTotalDb).toBe(CANON.summary.splTotalDb);
    expect(view.scalars.rt60SabineS).toBe(CANON.summary.rt60SabineS);
    expect(view.bands.rt60).toEqual(CANON.summary.rt60);
  });

  it("los escalares no arrastran los mapas por banda ni el meta", () => {
    const view = roundTrip(CANON);

    expect(view.scalars.rt60).toBeUndefined();
    expect("meta" in view.scalars).toBe(false);
  });

  it("recupera grillas, alertas y recomendaciones", () => {
    const grid = {
      points: [[1, 2, 1.2] as [number, number, number]],
      valuesDbA: [95],
    };
    const recommendation = {
      id: "reco_1",
      rule: "HeadroomRule",
      priority: 1,
      action: { type: "reduce_level", recommendedLevelDb: -6 },
      text: "Bajá el nivel.",
    };
    const alert = { metric: "uniformity", level: "warn" as const };

    const view = roundTrip({
      ...CANON,
      grids: { spl: grid, c50: grid },
      alerts: [alert],
      recommendations: [recommendation],
    });

    expect(view.splGrid).toEqual(grid);
    expect(view.clarityGrids.c50).toEqual(grid);
    expect(view.alerts).toEqual([alert]);
    expect(view.recommendations).toEqual([recommendation]);
  });

  it("una fila que falta deja su sección vacía en vez de reventar", () => {
    const view = fromSimResults([]);

    expect(view.meta).toBeNull();
    expect(view.splGrid).toBeNull();
    expect(view.alerts).toEqual([]);
    expect(view.recommendations).toEqual([]);
  });

  it("una fila ilegible se trata como ausente", () => {
    const view = fromSimResults([
      { kind: "ALERTS", summary: "esto no es un array", payload: null },
    ]);

    expect(view.alerts).toEqual([]);
  });
});
