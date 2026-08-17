// src/features/simulation/__tests__/panel-placement.test.ts — el panel, del muro al plano.
//
// Se protege lo que un SVG pequeño no delata: que el panel caiga en SU muro, del lado de DENTRO de
// la sala, y que uno que no cabe se recorte en vez de salirse por la esquina. El modelo pide paneles
// de 4 m en muros de 3 con más frecuencia de la que parece.

import { describe, expect, it } from "vitest";
import {
  fitPanel,
  panelAreaM2,
  placePanel,
} from "@/features/simulation/model/panel-placement";
import type { AcousticPanel } from "@/features/simulation/schemas/panel-advice";

/** Cuadrado de 10 × 10 m con esquina en el origen, antihorario. Muro 0 = el de abajo (y = 0). */
const SQUARE: [number, number][] = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
];

function panel(overrides: Partial<AcousticPanel> = {}): AcousticPanel {
  return {
    wallIndex: 0,
    startM: 2,
    lengthM: 3,
    heightM: 2,
    mountHeightM: 1,
    label: "Primera reflexión",
    reason: "Ataca la reflexión lateral de la caja izquierda.",
    ...overrides,
  };
}

describe("placePanel", () => {
  it("coloca el panel a lo largo de su muro, desde el primer vértice", () => {
    const placed = placePanel(SQUARE, panel());

    expect(placed).not.toBeNull();
    // Muro 0 va de (0,0) a (10,0): empieza en x=2 y acaba en x=5.
    expect(placed?.from[0]).toBeCloseTo(2, 5);
    expect(placed?.to[0]).toBeCloseTo(5, 5);
  });

  // Si se separara hacia fuera, el panel quedaría colgado por el lado de la calle.
  it("lo separa hacia DENTRO de la sala, no hacia fuera", () => {
    const placed = placePanel(SQUARE, panel());

    // El muro está en y = 0 y el interior es y > 0.
    expect(placed?.from[1]).toBeGreaterThan(0);
    expect(placed?.to[1]).toBeGreaterThan(0);
  });

  it("separa hacia dentro también en el muro de enfrente", () => {
    // Muro 2 va de (10,10) a (0,10): el interior es y < 10.
    const placed = placePanel(SQUARE, panel({ wallIndex: 2 }));

    expect(placed?.from[1]).toBeLessThan(10);
  });

  it("usa el muro que se le pide y no siempre el primero", () => {
    const first = placePanel(SQUARE, panel({ wallIndex: 0 }));
    const second = placePanel(SQUARE, panel({ wallIndex: 1 }));

    expect(first?.from).not.toEqual(second?.from);
    // Muro 1 va de (10,0) a (10,10): es vertical, así que la x apenas cambia.
    expect(second?.from[0]).toBeCloseTo(10 - 0.25, 5);
  });

  it("descarta un muro que no existe en vez de inventarle un sitio", () => {
    expect(placePanel(SQUARE, panel({ wallIndex: 9 }))).toBeNull();
  });

  it("deja el punto medio entre los dos extremos, para la etiqueta", () => {
    const placed = placePanel(SQUARE, panel());

    expect(placed?.midpoint[0]).toBeCloseTo(3.5, 5);
  });

  it("informa de lo que mide el muro donde cae", () => {
    expect(placePanel(SQUARE, panel())?.wallLengthM).toBeCloseTo(10, 5);
  });
});

describe("fitPanel", () => {
  it("deja en paz al que ya cabe", () => {
    const fitted = fitPanel(panel(), 10);

    expect(fitted).toEqual({ startM: 2, lengthM: 3, clamped: false });
  });

  it("recorta el que se pasa por el extremo y lo dice", () => {
    const fitted = fitPanel(panel({ startM: 8, lengthM: 5 }), 10);

    expect(fitted?.startM).toBe(8);
    expect(fitted?.lengthM).toBe(2);
    expect(fitted?.clamped).toBe(true);
  });

  // Un panel que arranca pasada la esquina suele ser un error de posición, no de tamaño.
  it("corre hacia atrás el que arranca fuera del muro", () => {
    const fitted = fitPanel(panel({ startM: 12, lengthM: 3 }), 10);

    expect(fitted?.startM).toBe(7);
    expect(fitted?.lengthM).toBe(3);
    expect(fitted?.clamped).toBe(true);
  });

  it("no deja que el recorte se salga por el otro lado", () => {
    const fitted = fitPanel(panel({ startM: 20, lengthM: 8 }), 3);

    expect(fitted?.startM).toBe(0);
    expect(fitted?.lengthM).toBe(3);
  });

  it("se rinde con un muro en el que no cabe nada", () => {
    expect(fitPanel(panel(), 0.2)).toBeNull();
  });
});

describe("panelAreaM2", () => {
  it("mide lo que se está proponiendo tratar", () => {
    const placed = placePanel(SQUARE, panel({ lengthM: 3, heightM: 2 }));

    expect(placed && panelAreaM2(placed)).toBe(6);
  });

  it("mide el panel recortado y no el que pidió el modelo", () => {
    const placed = placePanel(
      SQUARE,
      panel({ startM: 9, lengthM: 5, heightM: 2 }),
    );

    expect(placed && panelAreaM2(placed)).toBe(2);
  });
});
