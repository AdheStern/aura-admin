// prisma/seed/__tests__/datasets.test.ts — el seed no debe descubrirse roto al ejecutarse.
// Los datasets se calculan en runtime (curvas, sensibilidad, NRC, scattering), así que el tipado
// no basta: un redondeo fuera de rango o una banda mal formada solo aparece validando de verdad.

import { describe, expect, it } from "vitest";
import { amplifierSpecSchema } from "@/contracts/amplifier-spec.schema";
import { consoleSpecSchema } from "@/contracts/console-spec.schema";
import { materialSpecSchema } from "@/contracts/material-spec.schema";
import { microphoneSpecSchema } from "@/contracts/microphone-spec.schema";
import { sourceSpecSchema } from "@/contracts/source-spec.schema";
import { speakerSpecSchema } from "@/contracts/speaker-spec.schema";
import { AMPLIFIERS } from "../amplifiers";
import { CONSOLES } from "../consoles";
import { MATERIAL_SPECS } from "../materials";
import { MICROPHONES } from "../microphones";
import { SOURCES } from "../sources";
import { SPEAKERS } from "../speakers";

// Las cinco primeras son las cifras exactas del roadmap de Fase 1. Los amplificadores suman 2 más
// que los "5 PA" que pide el doc porque el catálogo incluye también los gestores de altavoces, que
// el roadmap no contaba; las fuentes no figuran en esa fila (ver el callout de la Sección 5.1).
const EXPECTED = {
  materiales: 40,
  parlantes: 15,
  microfonos: 10,
  consolas: 5,
  amplificadoresConPotencia: 5,
  procesadores: 2,
  fuentes: 11,
};

describe("Seed: cantidades del roadmap", () => {
  it("cumple las cifras de Fase 1", () => {
    expect({
      materiales: MATERIAL_SPECS.length,
      parlantes: SPEAKERS.length,
      microfonos: MICROPHONES.length,
      consolas: CONSOLES.length,
      amplificadoresConPotencia: AMPLIFIERS.filter(
        (a) => a.spec.kind !== "processor",
      ).length,
      procesadores: AMPLIFIERS.filter((a) => a.spec.kind === "processor")
        .length,
      fuentes: SOURCES.length,
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

  it.each(SOURCES.map((s) => [s.name, s] as const))(
    "fuente %s",
    (_name, spec) => {
      const parsed = sourceSpecSchema.safeParse(spec);
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
  it("no hay nombres de fuente duplicados: catalog_source los usa como clave única", () => {
    const names = SOURCES.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
  });

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

  it("todo amplificador con potencia la declara a 8Ω, la carga de referencia", () => {
    for (const { brand, model, spec } of AMPLIFIERS) {
      if (spec.kind === "processor") continue;
      expect(spec.powerPerChannelW["8"], `${brand} ${model}`).toBeGreaterThan(
        0,
      );
    }
  });

  it("el catálogo de PA cubre las dos variantes del contrato", () => {
    const kinds = new Set(AMPLIFIERS.map((a) => a.spec.kind));
    expect(kinds.has("processor"), "falta algún procesador").toBe(true);
    expect(
      [...kinds].some((k) => k !== "processor"),
      "falta algún amplificador con potencia",
    ).toBe(true);
  });

  it("toda fuente declara un rango de fundamentales creciente", () => {
    for (const spec of SOURCES) {
      const [low, high] = spec.fundamentalRangeHz;
      expect(low, spec.name).toBeGreaterThan(0);
      expect(high, spec.name).toBeGreaterThan(low);
    }
  });
});
