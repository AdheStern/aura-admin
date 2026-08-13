// src/features/simulation/__tests__/eq-curve.test.ts — la curva del paramétrico.
//
// Lo que se protege es que la curva sea la del filtro y no un dibujo parecido: si alguien la
// cambiara por una interpolación entre puntos, el operador vería una campana que su equipo no hace.

import { describe, expect, it } from "vitest";
import { eqCurve, gainAt } from "@/features/simulation/model/eq-curve";

const BOOST_4K = { frequencyHz: 4000, gainDb: 5.2, q: 1.41 };

describe("gainAt", () => {
  it("entrega la ganancia pedida en el centro de la campana", () => {
    expect(gainAt([BOOST_4K], 4000)).toBeCloseTo(5.2, 1);
  });

  it("se apaga lejos del centro", () => {
    expect(gainAt([BOOST_4K], 250)).toBeCloseTo(0, 1);
  });

  // Q = 1.41 es una octava: a media octava del centro queda cerca de la mitad de la ganancia.
  it("abre el ancho que pide la Q", () => {
    const halfOctave = gainAt([BOOST_4K], 4000 * 2 ** 0.5);

    expect(halfOctave).toBeGreaterThan(1);
    expect(halfOctave).toBeLessThan(5.2);
  });

  it("no toca nada con ganancia cero", () => {
    expect(gainAt([{ frequencyHz: 1000, gainDb: 0, q: 1.41 }], 1000)).toBe(0);
  });

  // Dos campanas que se solapan suman: es justo lo que una interpolación entre bandas escondería.
  it("suma en dB los filtros en cascada", () => {
    const bands = [
      { frequencyHz: 1000, gainDb: 3, q: 1.41 },
      { frequencyHz: 1200, gainDb: 3, q: 1.41 },
    ];

    expect(gainAt(bands, 1100)).toBeGreaterThan(3);
  });
});

describe("eqCurve", () => {
  it("muestrea log-espaciado entre los extremos pedidos", () => {
    const curve = eqCurve([BOOST_4K], { fromHz: 20, toHz: 20_000, points: 5 });

    expect(curve).toHaveLength(5);
    expect(curve[0].frequencyHz).toBeCloseTo(20, 5);
    expect(curve[4].frequencyHz).toBeCloseTo(20_000, 5);
    expect(curve[2].frequencyHz).toBeCloseTo(632.5, 0);
  });

  it("deja la curva plana cuando no hay filtros", () => {
    const curve = eqCurve([], { points: 8 });

    expect(curve.every((point) => point.gainDb === 0)).toBe(true);
  });

  it("descarta filtros con Q no positiva en vez de devolver NaN", () => {
    const curve = eqCurve([{ frequencyHz: 1000, gainDb: 6, q: 0 }], {
      points: 8,
    });

    expect(curve.every((point) => Number.isFinite(point.gainDb))).toBe(true);
  });
});
