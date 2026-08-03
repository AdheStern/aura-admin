// prisma/seed/__tests__/datasets.test.ts — el seed no debe descubrirse roto al ejecutarse.
// Los datasets se calculan en runtime (curvas, sensibilidad, NRC, scattering), así que el tipado
// no basta: un redondeo fuera de rango o una banda mal formada solo aparece validando de verdad.

import { describe, expect, it } from "vitest";
import { amplifierSpecSchema } from "@/contracts/amplifier-spec.schema";
import { consoleSpecSchema } from "@/contracts/console-spec.schema";
import { materialSpecSchema } from "@/contracts/material-spec.schema";
import { microphoneSpecSchema } from "@/contracts/microphone-spec.schema";
import { speakerSpecSchema } from "@/contracts/speaker-spec.schema";
import { AMPLIFIERS } from "../amplifiers";
import { CONSOLES } from "../consoles";
import { MATERIAL_SPECS } from "../materials";
import { MICROPHONES } from "../microphones";
import { SPEAKERS } from "../speakers";

/** Cantidades exactas que pide el roadmap de Fase 1 (línea 1228 del doc maestro). */
const EXPECTED = {
  materiales: 40,
  parlantes: 15,
  microfonos: 10,
  consolas: 5,
  amplificadores: 5,
};

describe("Seed: cantidades del roadmap", () => {
  it("cumple las cinco cifras de Fase 1", () => {
    expect({
      materiales: MATERIAL_SPECS.length,
      parlantes: SPEAKERS.length,
      microfonos: MICROPHONES.length,
      consolas: CONSOLES.length,
      amplificadores: AMPLIFIERS.length,
    }).toEqual(EXPECTED);
  });
});

describe("Seed: cada ítem valida contra su contrato", () => {
  it.each(MATERIAL_SPECS.map((s) => [s.name, s] as const))(
    "material %s",
    (_name, spec) => {
      const parsed = materialSpecSchema.safeParse(spec);
      expect(
        parsed.success,
        JSON.stringify(parsed.error?.issues, null, 2),
      ).toBe(true);
    },
  );

  const equipment = [
    ...SPEAKERS.map((e) => ["parlante", e, speakerSpecSchema] as const),
    ...MICROPHONES.map((e) => ["micrófono", e, microphoneSpecSchema] as const),
    ...CONSOLES.map((e) => ["consola", e, consoleSpecSchema] as const),
    ...AMPLIFIERS.map((e) => ["amplificador", e, amplifierSpecSchema] as const),
  ];

  it.each(
    equipment.map(
      (e) => [`${e[0]} ${e[1].brand} ${e[1].model}`, e[1], e[2]] as const,
    ),
  )("%s", (_label, entry, schema) => {
    const parsed = schema.safeParse(entry.spec);
    expect(parsed.success, JSON.stringify(parsed.error?.issues, null, 2)).toBe(
      true,
    );
  });
});

describe("Seed: reglas del dominio", () => {
  it("no hay marca+modelo duplicados dentro de cada catálogo", () => {
    for (const [label, list] of [
      ["parlantes", SPEAKERS],
      ["micrófonos", MICROPHONES],
      ["consolas", CONSOLES],
      ["amplificadores", AMPLIFIERS],
    ] as const) {
      const keys = list.map((e) => `${e.brand}|${e.model}`);
      expect(new Set(keys).size, `${label} tiene duplicados`).toBe(keys.length);
    }
  });

  // catalog_material no tiene @@unique, así que la idempotencia del seed depende del nombre:
  // dos materiales homónimos harían que la segunda pasada sobrescribiera al primero.
  it("no hay nombres de material duplicados", () => {
    const names = MATERIAL_SPECS.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("incluye los dos materiales normativos del doc maestro", () => {
    const names = MATERIAL_SPECS.map((s) => s.name);
    expect(names.some((n) => n.includes("mat_audiencia"))).toBe(true);
    expect(names.some((n) => n.includes("CANON-01"))).toBe(true);
  });

  it("la curva de respuesta se puede graficar y va de grave a agudo", () => {
    for (const { brand, model, spec } of SPEAKERS) {
      const curve = spec.frequencyResponse.curve;
      expect(curve.length, `${brand} ${model}`).toBeGreaterThanOrEqual(2);
      const hz = curve.map(([f]) => f);
      expect(
        [...hz].sort((a, b) => a - b),
        `${brand} ${model}`,
      ).toEqual(hz);
      // Estrictamente creciente: dos puntos a la misma frecuencia afirmarían dos niveles a la vez.
      expect(new Set(hz).size, `${brand} ${model} repite frecuencia`).toBe(
        hz.length,
      );
    }
  });

  it("la curva del micrófono tampoco repite frecuencia", () => {
    for (const { brand, model, spec } of MICROPHONES) {
      const hz = spec.frequencyResponse.curve.map(([f]) => f);
      expect(new Set(hz).size, `${brand} ${model}`).toBe(hz.length);
    }
  });

  it("todo amplificador declara la potencia a 8Ω, que es la carga de referencia", () => {
    for (const { brand, model, spec } of AMPLIFIERS) {
      expect(spec.powerPerChannelW["8"], `${brand} ${model}`).toBeGreaterThan(
        0,
      );
    }
  });
});
