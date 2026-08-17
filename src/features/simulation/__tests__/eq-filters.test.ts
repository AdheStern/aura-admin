// src/features/simulation/__tests__/eq-filters.test.ts — los filtros que no son campana.
//
// El motor solo manda campanas, pero el asesor de mezcla propone shelves y cortes. Lo que se
// protege es que cada tipo se DIBUJE como lo que es: un pasa-altos pintado con la fórmula de la
// campana daría una curva plana en graves —justo donde corta— y el operador teclearía otra cosa.

import { describe, expect, it } from "vitest";
import { gainAt } from "@/features/simulation/model/eq-curve";

// Q = 1/√2: la respuesta maximalmente plana con la que se especifican shelves y cortes.
const BUTTERWORTH_Q = Math.SQRT1_2;

describe("filtros de tipo distinto de campana", () => {
  it("el pasa-altos corta por debajo y deja pasar por encima", () => {
    const hpf = [
      {
        frequencyHz: 100,
        gainDb: 0,
        q: BUTTERWORTH_Q,
        filterType: "high_pass" as const,
      },
    ];

    expect(gainAt(hpf, 25)).toBeLessThan(-20);
    expect(gainAt(hpf, 100)).toBeCloseTo(-3, 0);
    expect(gainAt(hpf, 2000)).toBeCloseTo(0, 1);
  });

  it("el pasa-bajos hace lo contrario", () => {
    const lpf = [
      {
        frequencyHz: 2000,
        gainDb: 0,
        q: BUTTERWORTH_Q,
        filterType: "low_pass" as const,
      },
    ];

    expect(gainAt(lpf, 200)).toBeCloseTo(0, 1);
    expect(gainAt(lpf, 2000)).toBeCloseTo(-3, 0);
    expect(gainAt(lpf, 16_000)).toBeLessThan(-15);
  });

  it("el shelf bajo levanta los graves y deja los agudos donde estaban", () => {
    const shelf = [
      {
        frequencyHz: 200,
        gainDb: 6,
        q: BUTTERWORTH_Q,
        filterType: "low_shelf" as const,
      },
    ];

    expect(gainAt(shelf, 30)).toBeCloseTo(6, 0);
    expect(gainAt(shelf, 5000)).toBeCloseTo(0, 1);
  });

  it("el shelf alto levanta los agudos y deja los graves donde estaban", () => {
    const shelf = [
      {
        frequencyHz: 4000,
        gainDb: 4,
        q: BUTTERWORTH_Q,
        filterType: "high_shelf" as const,
      },
    ];

    expect(gainAt(shelf, 16_000)).toBeCloseTo(4, 0);
    expect(gainAt(shelf, 100)).toBeCloseTo(0, 1);
  });

  // gainDb no significa nada en un corte: la salida temprana por ganancia cero lo dejaría plano.
  it("el corte atenúa aunque su ganancia sea cero", () => {
    expect(
      gainAt(
        [
          {
            frequencyHz: 300,
            gainDb: 0,
            q: BUTTERWORTH_Q,
            filterType: "high_pass" as const,
          },
        ],
        40,
      ),
    ).toBeLessThan(-10);
  });

  it("sin filterType sigue siendo campana, como manda el motor", () => {
    const bell = [{ frequencyHz: 1000, gainDb: 6, q: 1.41 }];

    expect(gainAt(bell, 1000)).toBeCloseTo(6, 1);
    expect(gainAt(bell, 60)).toBeCloseTo(0, 1);
  });
});
