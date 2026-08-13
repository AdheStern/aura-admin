// src/features/simulation/__tests__/map-ruler.test.ts — las marcas de la regla del mapa.
//
// Lo que se protege es que la regla se lea como una cinta métrica: cero en la esquina del recinto y
// las dos direcciones contando igual. El editor coloca la planta donde le toque, así que medir en
// coordenadas del mundo hacía que un eje empezara en 4 y el otro en 0 sin motivo visible.
//
// Y que la marca caiga sobre su metro: la posición es un porcentaje de lo DIBUJADO, que lleva un
// metro de aire alrededor del recinto. Calcularla contra el recinto correría la regla ese metro.

import { describe, expect, it } from "vitest";
import {
  formatMetres,
  niceStepM,
  rulerTicks,
} from "@/features/simulation/model/map-ruler";

/** Una sala de 12 × 8 m que el editor dejó lejos del origen, con un metro de aire alrededor. */
const OFFSET_ROOM = {
  originM: 4,
  lengthM: 12,
  drawnMinM: 3,
  drawnLengthM: 14,
};

describe("niceStepM", () => {
  // Un paso "feo" (3.7 m) obligaría a leer cada etiqueta en vez de contar de dos en dos.
  it("elige números redondos", () => {
    for (const length of [4, 9, 14, 30, 75, 120]) {
      expect([0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100]).toContain(
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
  // Es el fallo que se vio en pantalla: horizontal empezando en 4 y vertical en 0.
  it("empieza en cero aunque el recinto esté lejos del origen del mundo", () => {
    expect(rulerTicks(OFFSET_ROOM)[0].valueM).toBe(0);
  });

  it("cuenta metros de recinto, no coordenadas", () => {
    const ticks = rulerTicks(OFFSET_ROOM);

    expect(ticks.map((tick) => tick.valueM)).toEqual([0, 2, 4, 6, 8, 10, 12]);
  });

  // Los dos ejes de una misma sala tienen que empezar igual, que es lo que se veía raro.
  it("arranca igual en los dos ejes de un recinto descentrado", () => {
    const horizontal = rulerTicks(OFFSET_ROOM);
    const vertical = rulerTicks({
      originM: 0,
      lengthM: 8,
      drawnMinM: -1,
      drawnLengthM: 10,
    });

    expect(horizontal[0].valueM).toBe(vertical[0].valueM);
  });

  it("coloca el cero sobre la esquina del recinto, no sobre el borde del dibujo", () => {
    const [first] = rulerTicks(OFFSET_ROOM);

    // La esquina está a 1 m del borde de lo dibujado: 1/14 del ancho.
    expect(first.positionPct).toBeCloseTo((1 / 14) * 100, 5);
  });

  it("coloca la última marca sobre la pared opuesta", () => {
    const last = rulerTicks(OFFSET_ROOM).at(-1);

    expect(last?.valueM).toBe(12);
    expect(last?.positionPct).toBeCloseTo((13 / 14) * 100, 5);
  });

  it("no se sale de lo dibujado por ningún lado", () => {
    for (const tick of rulerTicks(OFFSET_ROOM)) {
      expect(tick.positionPct).toBeGreaterThanOrEqual(0);
      expect(tick.positionPct).toBeLessThanOrEqual(100);
    }
  });

  // Una sala de 12.4 m con paso de 2 se rotula hasta 12: se marca la cinta, no la pared.
  it("no inventa una marca más allá de la pared", () => {
    const ticks = rulerTicks({
      originM: 0,
      lengthM: 12.4,
      drawnMinM: -1,
      drawnLengthM: 14.4,
    });

    expect(ticks.at(-1)?.valueM).toBe(12);
  });

  it("no arrastra la basura de sumar en coma flotante a la etiqueta", () => {
    const ticks = rulerTicks({
      originM: 0,
      lengthM: 3,
      drawnMinM: -1,
      drawnLengthM: 5,
    });

    for (const tick of ticks) {
      expect(formatMetres(tick.valueM)).not.toContain("000000");
    }
  });

  it("devuelve una lista vacía si no hay recinto que rotular", () => {
    expect(
      rulerTicks({ originM: 0, lengthM: 0, drawnMinM: 0, drawnLengthM: 4 }),
    ).toEqual([]);
  });
});

describe("formatMetres", () => {
  it("quita el decimal cuando no aporta", () => {
    expect(formatMetres(4)).toBe("4");
    expect(formatMetres(2.5)).toBe("2.5");
  });
});
