// src/features/simulation/__tests__/rt-target-presets.test.ts — la taxonomía de tipos de sala.
//
// Los tres rangos están fijados contra la tabla de la Sección 02. No es ceremonia: son números con
// apariencia de norma, y si alguien los "ajusta a ojo" el usuario recibe recomendaciones de
// tratamiento contra un criterio que ya no cita a nadie.

import { describe, expect, it } from "vitest";
import { simulationConfigSchema } from "@/contracts";
import {
  isValidTarget,
  presetOf,
  RT_TARGET_PRESETS,
} from "@/features/simulation/model/rt-target-presets";

describe("RT_TARGET_PRESETS", () => {
  it("son los tres rangos que publica la §02", () => {
    expect(
      RT_TARGET_PRESETS.map((preset) => [preset.id, ...preset.rangeS]),
    ).toEqual([
      ["speech", 0.6, 1.0],
      ["sacred_music", 1.8, 3.0],
      ["mixed_auditorium", 1.0, 1.6],
    ]);
  });

  // Un preset que el contrato rechazara sería un botón que produce un error al simular.
  it("todos pasan el contrato", () => {
    for (const preset of RT_TARGET_PRESETS) {
      const parsed = simulationConfigSchema.safeParse({
        mode: "simple",
        methods: ["statistical"],
        bands: [1000],
        grid: { resolutionM: 1, earHeightM: 1.2 },
        summation: "energy",
        rtTargetS: preset.rangeS,
      });

      expect(parsed.success, preset.id).toBe(true);
    }
  });
});

describe("presetOf", () => {
  it("reconoce el rango de un preset", () => {
    expect(presetOf([1.8, 3.0])?.id).toBe("sacred_music");
  });

  it("un rango tecleado a mano no es ningún preset", () => {
    expect(presetOf([1.2, 1.4])).toBeNull();
  });

  it("sin objetivo no hay preset", () => {
    expect(presetOf(null)).toBeNull();
  });
});

describe("isValidTarget", () => {
  it("coincide con el .refine() del contrato", () => {
    expect(isValidTarget(1.0, 1.6)).toBe(true);
    expect(isValidTarget(1.2, 1.2)).toBe(true);
    expect(isValidTarget(1.6, 1.0)).toBe(false);
    expect(isValidTarget(0, 1.6)).toBe(false);
  });
});
