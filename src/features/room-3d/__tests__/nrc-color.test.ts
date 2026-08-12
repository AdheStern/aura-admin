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
  it("gris claro, fuera de la rampa, cuando no hay material asignado", () => {
    expect(nrcColorHex(null)).toBe("#e4e4e7");
  });

  it("gris medio en NRC 0 y gris oscuro en NRC 1", () => {
    expect(nrcColorHex(0)).toBe("#a1a1aa");
    expect(nrcColorHex(1)).toBe("#3f3f46");
  });

  it("toda la rampa es gris: nada de color compitiendo con las zonas", () => {
    for (const nrc of [0, 0.1, 0.35, 0.5, 0.75, 1]) {
      const [r, g, b] = [1, 3, 5].map((at) =>
        Number.parseInt(nrcColorHex(nrc).slice(at, at + 2), 16),
      );
      expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(16);
    }
  });

  it("recorta valores fuera de [0, 1]", () => {
    expect(nrcColorHex(-5)).toBe(nrcColorHex(0));
    expect(nrcColorHex(5)).toBe(nrcColorHex(1));
  });
});
