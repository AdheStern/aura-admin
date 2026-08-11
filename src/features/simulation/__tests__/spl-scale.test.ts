// src/features/simulation/__tests__/spl-scale.test.ts — la rampa fija de 70–110 dB.
// Lo que importa es que sea fija, monótona en los cuatro tramos y que no invente colores fuera.

import { describe, expect, it } from "vitest";
import {
  SPL_MAX_DB,
  SPL_MIN_DB,
  splColor,
  splLegendStops,
} from "@/features/simulation/model/spl-scale";

const HEX = /^#[0-9a-f]{6}$/;

describe("splColor", () => {
  it("siempre devuelve un hex, dentro y fuera del rango", () => {
    for (const db of [-50, 0, 70, 85, 110, 200]) {
      expect(splColor(db)).toMatch(HEX);
    }
  });

  it("recorta fuera del rango en vez de extrapolar", () => {
    expect(splColor(20)).toBe(splColor(SPL_MIN_DB));
    expect(splColor(200)).toBe(splColor(SPL_MAX_DB));
  });

  it("los extremos son el azul y el rojo de los anclajes", () => {
    expect(splColor(SPL_MIN_DB)).toBe("#0084d1");
    expect(splColor(SPL_MAX_DB)).toBe("#dc2626");
  });

  it("la escala es fija: el mismo dB da el mismo color siempre", () => {
    expect(splColor(93.4)).toBe(splColor(93.4));
  });

  it("no se queda gris a mitad de camino entre azul y verde", () => {
    // El punto medio del primer tramo en sRGB daría un gris apagado; en OKLab conserva croma.
    const [, r, g, b] = /^#(..)(..)(..)$/.exec(splColor(76.66)) ?? [];
    const channels = [r, g, b].map((c) => Number.parseInt(c, 16));
    const spread = Math.max(...channels) - Math.min(...channels);

    expect(spread).toBeGreaterThan(40);
  });
});

describe("splLegendStops", () => {
  it("cubre el rango entero con el paso pedido", () => {
    const stops = splLegendStops(5);

    expect(stops[0].db).toBe(SPL_MIN_DB);
    expect(stops.at(-1)?.db).toBe(SPL_MAX_DB);
    expect(stops).toHaveLength(9);
  });
});
