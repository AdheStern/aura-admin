// src/features/room-3d/__tests__/nrc-color.test.ts — derivación de NRC y su color asociado.

import { describe, expect, it } from "vitest";
import type { OctaveBandKey } from "@/contracts/bands";
import { deriveNrc, nrcColorHex } from "@/features/room-3d/model/nrc-color";

function absorption(
  partial: Partial<Record<OctaveBandKey, number>>,
): Record<OctaveBandKey, number> {
  return {
    "125": 0,
    "250": 0,
    "500": 0,
    "1000": 0,
    "2000": 0,
    "4000": 0,
    ...partial,
  };
}

describe("deriveNrc", () => {
  it("usa el nrc del catálogo cuando ya viene calculado", () => {
    expect(deriveNrc({ nrc: 0.8, absorption: absorption({}) })).toBe(0.8);
  });

  it("si no hay nrc, promedia 250-2000 Hz y redondea a 0.05", () => {
    const nrc = deriveNrc({
      absorption: absorption({
        "250": 0.1,
        "500": 0.12,
        "1000": 0.14,
        "2000": 0.15,
      }),
    });
    // promedio = 0.1275 -> redondeado a pasos de 0.05 -> 0.15
    expect(nrc).toBe(0.15);
  });

  it("las bandas 125/4000 no cuentan en el promedio", () => {
    expect(deriveNrc({ absorption: absorption({ "1000": 1 }) })).toBe(0.25);
  });
});

describe("nrcColorHex", () => {
  it("gris neutro cuando no hay material asignado", () => {
    expect(nrcColorHex(null)).toBe("#9ca3af");
  });

  it("rojo puro en NRC 0 y verde puro en NRC 1", () => {
    expect(nrcColorHex(0)).toBe("#ef4444");
    expect(nrcColorHex(1)).toBe("#22c55e");
  });

  it("recorta valores fuera de [0, 1]", () => {
    expect(nrcColorHex(-5)).toBe(nrcColorHex(0));
    expect(nrcColorHex(5)).toBe(nrcColorHex(1));
  });
});
