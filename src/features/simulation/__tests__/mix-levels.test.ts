// src/features/simulation/__tests__/mix-levels.test.ts — dónde cae la cápsula del fader.
//
// Lo que se protege es que la posición corresponda al número escrito encima. Si alguien metiera
// aquí la curva expandida de un fader físico, la cápsula dejaría de coincidir con los dB que el
// operador va a teclear, que es lo único que se lleva a la mesa.

import { describe, expect, it } from "vitest";
import {
  faderPositionPct,
  formatPan,
  unityPositionPct,
} from "@/features/simulation/model/mix-levels";
import { MIX_LEVEL_DB_RANGE } from "@/features/simulation/schemas/mix-advice";

describe("faderPositionPct", () => {
  it("pone los extremos del recorrido en el suelo y en el techo", () => {
    expect(faderPositionPct(MIX_LEVEL_DB_RANGE.min)).toBe(0);
    expect(faderPositionPct(MIX_LEVEL_DB_RANGE.max)).toBe(100);
  });

  // El rango es asimétrico (−24…+12), así que la unidad NO está a media altura: está a dos tercios.
  it("deja la unidad donde toca, no en el centro", () => {
    expect(unityPositionPct()).toBeCloseTo(66.7, 1);
  });

  it("es lineal en decibelios", () => {
    const bottom = faderPositionPct(-24);
    const middle = faderPositionPct(-6);
    const top = faderPositionPct(12);

    expect(middle - bottom).toBeCloseTo(top - middle, 5);
  });

  it("sube al subir el nivel", () => {
    expect(faderPositionPct(3)).toBeGreaterThan(faderPositionPct(-3));
  });

  // Un valor imposible no debe pintarse fuera del raíl.
  it("acota lo que se salga del rango", () => {
    expect(faderPositionPct(-500)).toBe(0);
    expect(faderPositionPct(500)).toBe(100);
  });
});

describe("formatPan", () => {
  it("rotula el centro como una mesa, no como un cero", () => {
    expect(formatPan(0)).toBe("C");
  });

  it("distingue izquierda de derecha por letra y no por signo", () => {
    expect(formatPan(-45)).toBe("L45");
    expect(formatPan(30)).toBe("R30");
  });

  it("redondea a entero: medio por ciento de pan no significa nada", () => {
    expect(formatPan(-45.4)).toBe("L45");
    expect(formatPan(0.2)).toBe("C");
  });
});
