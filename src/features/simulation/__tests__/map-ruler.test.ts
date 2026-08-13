// src/features/simulation/__tests__/map-ruler.test.ts — las marcas de la regla del mapa.
//
// Lo que se protege es que la marca caiga sobre su metro: la posición sale en porcentaje del tramo
// dibujado, y si se calculara contra el recinto en vez de contra el tramo, la regla quedaría
// desplazada justo el metro de aire que el mapa deja alrededor.

import { describe, expect, it } from "vitest";
import {
  formatMetres,
  niceStepM,
  rulerTicks,
} from "@/features/simulation/model/map-ruler";

describe("niceStepM", () => {
  // Un paso "feo" (3.7 m) obligaría a leer cada etiqueta en vez de contar de dos en dos.
  it("elige números redondos", () => {
    for (const length of [4, 9, 14, 30, 75, 120]) {
      expect([1, 2, 5, 10, 20, 50, 100, 0.5, 0.2, 0.1]).toContain(
        niceStepM(length),
      );
    }
  });

  it("reparte el lado en un número legible de tramos", () => {
    for (const length of [4, 9, 14, 30, 75, 120]) {
      const divisions = length / niceStepM(length);

      expect(divisions).toBeGreaterThanOrEqual(3);
      expect(divisions).toBeLessThanOrEqual(12);
    }
  });

  it("crece con el recinto: una nave no se rotula como un aula", () => {
    expect(niceStepM(40)).toBeGreaterThan(niceStepM(8));
  });

  it("no devuelve un paso imposible con un lado degenerado", () => {
    expect(niceStepM(0)).toBe(1);
  });
});

describe("rulerTicks", () => {
  it("sitúa cada marca en su porcentaje del tramo dibujado", () => {
    const ticks = rulerTicks(0, 10);

    expect(ticks[0]).toEqual({ valueM: 0, positionPct: 0 });
    expect(ticks.at(-1)).toEqual({ valueM: 10, positionPct: 100 });
  });

  // El tramo dibujado lleva un metro de aire alrededor: rotular el borde diría que el recinto
  // empieza donde no empieza.
  it("arranca dentro del tramo, no en el borde", () => {
    const ticks = rulerTicks(-1, 14);

    expect(ticks[0].valueM).toBe(0);
    expect(ticks[0].positionPct).toBeCloseTo((1 / 14) * 100, 5);
  });

  it("no se sale por ningún lado", () => {
    for (const tick of rulerTicks(-1.5, 22)) {
      expect(tick.positionPct).toBeGreaterThanOrEqual(0);
      expect(tick.positionPct).toBeLessThanOrEqual(100);
    }
  });

  it("no arrastra la basura de sumar en coma flotante a la etiqueta", () => {
    for (const tick of rulerTicks(0, 3)) {
      expect(formatMetres(tick.valueM)).not.toContain("000000");
    }
  });

  it("devuelve una lista vacía si no hay tramo que rotular", () => {
    expect(rulerTicks(0, 0)).toEqual([]);
  });
});

describe("formatMetres", () => {
  it("quita el decimal cuando no aporta", () => {
    expect(formatMetres(4)).toBe("4");
    expect(formatMetres(2.5)).toBe("2.5");
  });
});
