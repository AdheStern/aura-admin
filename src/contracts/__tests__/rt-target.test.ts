// src/contracts/__tests__/rt-target.test.ts — el rango objetivo de RT60 del contrato.
//
// El `min <= max` no cabe en el JSON Schema, así que lo comprueban zod y Pydantic por separado. Si
// este test cae, los dos lados dejan de coincidir: la app aceptaría un rango que el motor rechaza y
// el usuario vería un INVALID_PAYLOAD al simular en vez de un error en el formulario.

import { describe, expect, it } from "vitest";
import { simulationConfigSchema } from "@/contracts";

const BASE = {
  mode: "simple",
  methods: ["statistical"],
  bands: [1000],
  grid: { resolutionM: 1, earHeightM: 1.2 },
  summation: "energy",
} as const;

function parse(rtTargetS: unknown) {
  return simulationConfigSchema.safeParse({ ...BASE, rtTargetS });
}

describe("config.rtTargetS", () => {
  it("acepta un rango creciente", () => {
    expect(parse([1.0, 1.6]).success).toBe(true);
  });

  // Objetivo puntual: el cálculo inverso de la §02 ("¿cuánto absorbente para llegar a 1.2 s?").
  it("acepta min == max", () => {
    expect(parse([1.2, 1.2]).success).toBe(true);
  });

  it("rechaza un rango invertido", () => {
    expect(parse([1.6, 1.0]).success).toBe(false);
  });

  it("rechaza un extremo no positivo: dividir por él da infinito", () => {
    expect(parse([0, 1.6]).success).toBe(false);
    expect(parse([-1, 1.6]).success).toBe(false);
  });

  it("null es válido y significa no evaluar la regla", () => {
    expect(parse(null).success).toBe(true);
  });

  it("ausente cae a null, que es el valor por defecto", () => {
    const parsed = simulationConfigSchema.safeParse(BASE);

    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.rtTargetS).toBeNull();
  });
});
