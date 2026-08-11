// src/features/simulation/__tests__/suggest-treatment.test.ts
//
// El fallo silencioso que estos tests vigilan: dimensionar con α en vez de con Δα. Un muro que ya
// absorbe 0.3 y se cubre con un material de 0.8 gana 0.5 por m², no 0.8 — pedir 58/0.8 en vez de
// 58/0.5 se queda un 37 % corto y la sala sigue sonando igual de larga.

import { describe, expect, it } from "vitest";
import {
  type AbsorptionCandidate,
  suggestTreatment,
} from "@/features/simulation/model/suggest-treatment";
import type { TreatableSurface } from "@/features/simulation/model/treatable-surfaces";

const WALL: TreatableSurface = {
  id: "wall_1",
  type: "wall",
  label: "Muro 1",
  areaM2: 120,
  materialId: "mat_ladrillo",
};

const PANEL: AbsorptionCandidate = {
  id: "mat_panel",
  name: "Panel absorbente",
  absorption: { "125": 0.8, "1000": 0.9 },
};

const INSTALLED = { mat_ladrillo: { "125": 0.3, "1000": 0.05 } };

function suggest(
  overrides: Partial<Parameters<typeof suggestTreatment>[0]> = {},
) {
  return suggestTreatment({
    direction: "add",
    bandKey: "125",
    deltaAbsorptionM2: 25,
    surfaces: [WALL],
    installed: INSTALLED,
    candidates: [PANEL],
    ...overrides,
  });
}

describe("suggestTreatment", () => {
  it("dimensiona con la GANANCIA, no con la absorción del material", () => {
    const [option] = suggest();

    // 25 / (0.8 − 0.3) = 50 m². Con α a secas saldrían 31.25, un 37 % de menos.
    expect(option.areaM2).toBeCloseTo(50, 5);
    expect(option.coverage).toBeCloseTo(50 / 120, 5);
  });

  it("descarta un material que no mejora lo que ya hay", () => {
    const worse = { ...PANEL, absorption: { "125": 0.3 } };

    expect(suggest({ candidates: [worse] })).toEqual([]);
  });

  it("descarta lo que no cabe en la superficie", () => {
    // 200 / 0.5 = 400 m² sobre un muro de 120.
    expect(suggest({ deltaAbsorptionM2: 200 })).toEqual([]);
  });

  it("al reducir absorción se invierte la dirección", () => {
    const reflective = { ...PANEL, absorption: { "125": 0.1 } };
    const [option] = suggest({ direction: "reduce", candidates: [reflective] });

    // 25 / (0.3 − 0.1) = 125 m² > 120, no cabe... con un muro mayor sí.
    expect(option).toBeUndefined();

    const [wider] = suggest({
      direction: "reduce",
      candidates: [reflective],
      surfaces: [{ ...WALL, areaM2: 200 }],
    });
    expect(wider.areaM2).toBeCloseTo(125, 5);
  });

  it("una banda que el material no publica se salta", () => {
    expect(suggest({ bandKey: "4000" })).toEqual([]);
  });

  it("da una fila por material, la de menos metros, y ordenada", () => {
    const ceiling: TreatableSurface = {
      ...WALL,
      id: "ceiling",
      label: "Techo",
      areaM2: 240,
    };
    const mejor: AbsorptionCandidate = {
      id: "mat_mejor",
      name: "Mejor",
      absorption: { "125": 0.9 },
    };

    const options = suggest({
      surfaces: [WALL, ceiling],
      candidates: [PANEL, mejor],
    });

    expect(options).toHaveLength(2);
    expect(options.map((item) => item.materialId)).toEqual([
      "mat_mejor",
      "mat_panel",
    ]);
    // 25 / (0.9 − 0.3) ≈ 41.7 m², y elige la superficie donde menos ocupa.
    expect(options[0].areaM2).toBeCloseTo(25 / 0.6, 5);
  });

  it("sin déficit no hay nada que sugerir", () => {
    expect(suggest({ deltaAbsorptionM2: 0 })).toEqual([]);
  });
});
