// src/features/simulation/__tests__/mix-context.test.ts — el resumen que ve la IA.
//
// Dos cosas que protegen dinero y criterio: que las grillas densas NO viajen (42 puntos × 6 bandas
// por métrica queman contexto sin aportar nada que un asesor de mezcla pueda usar) y que las
// recomendaciones deterministas SÍ, para que el modelo no contradiga a la física.

import { describe, expect, it } from "vitest";
import type { SimulationView } from "@/features/simulation/model/from-sim-results";
import { buildMixContext } from "@/features/simulation/model/mix-context";

function view(overrides: Partial<SimulationView> = {}): SimulationView {
  return {
    meta: null,
    scalars: {},
    bands: {},
    splGrid: null,
    cancellationGrid: null,
    clarityGrids: { c50: null, c80: null },
    alerts: [],
    recommendations: [],
    ...overrides,
  };
}

describe("buildMixContext", () => {
  it("promedia el SPL por banda en energía, no en decibelios", () => {
    const context = buildMixContext(
      view({
        splGrid: {
          points: [
            [0, 0, 0],
            [1, 0, 0],
          ],
          valuesDbByBand: { "1000": [80, 90] },
        },
      }),
    );

    // La media aritmética daría 85.0; la energética pesa el pico y da ~87.4.
    expect(context.splByBandDb["1000"]).toBeCloseTo(87.4, 1);
  });

  it("cita el RT60 medio como la media de 500 y 1000 Hz", () => {
    const context = buildMixContext(
      view({ bands: { rt60: { "500": 1.2, "1000": 1.4, "4000": 0.8 } } }),
    );

    expect(context.rt60MidS).toBeCloseTo(1.3, 2);
  });

  it("deja el RT60 medio en null si el motor no calculó esas bandas", () => {
    expect(buildMixContext(view()).rt60MidS).toBeNull();
  });

  // Sin esto la IA puede mandar bajar justo la banda que SourceEqRule mandó subir.
  it("lleva las recomendaciones deterministas ya emitidas", () => {
    const context = buildMixContext(
      view({
        recommendations: [
          {
            id: "r1",
            rule: "SourceEqRule",
            priority: 1,
            action: { type: "source_eq" },
            text: "Sube 4 kHz en la caja principal.",
          },
        ],
      }),
    );

    expect(context.deterministic).toEqual([
      {
        rule: "SourceEqRule",
        action: "source_eq",
        text: "Sube 4 kHz en la caja principal.",
      },
    ]);
  });

  it("no arrastra la grilla densa al prompt", () => {
    const context = buildMixContext(
      view({
        splGrid: {
          points: Array.from(
            { length: 42 },
            () => [0, 0, 0] as [number, number, number],
          ),
          valuesDbA: Array.from({ length: 42 }, () => 90),
          valuesDbByBand: { "1000": Array.from({ length: 42 }, () => 90) },
        },
      }),
    );

    const serialised = JSON.stringify(context);
    expect(serialised).not.toContain("points");
    expect(serialised).not.toContain("valuesDbA");
    expect(context.splByBandDb["1000"]).toBeCloseTo(90, 1);
  });

  it("se queda solo con los escalares que un asesor de mezcla puede usar", () => {
    const context = buildMixContext(
      view({ scalars: { splAvgDb: 92.456, soundSpeedMps: 343.2 } }),
    );

    expect(context.scalars.splAvgDb).toBe(92.46);
    expect(context.scalars.soundSpeedMps).toBeUndefined();
  });
});
