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
import { directivityIndexDb } from "../derive";
import { MATERIAL_SPECS } from "../materials";
import { MICROPHONES } from "../microphones";
import { SOURCES } from "../sources";
import { SPEAKERS } from "../speakers";

// Cifras del roadmap de Fase 1, con dos desvíos declarados: los amplificadores suman 2 más que los
// "5 PA" que pide el doc porque el catálogo incluye también los gestores de altavoces, que el
// roadmap no contaba, y las consolas suman 1 más porque el catálogo aloja además una interfaz de
// audio (ver el comentario de su fila en seed/consoles.ts). Las fuentes no figuran en esa fila
// (ver el callout de la Sección 5.1).
const EXPECTED = {
  materiales: 40,
  parlantes: 15,
  microfonos: 10,
  consolas: 6,
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

  // El motor deriva Q del DI para las formulas estadisticas. Con el diccionario vacio no calcula:
  // lanza y el job termina FAILED. Los quince parlantes entraron asi hasta que se probo el ciclo
  // contra el motor real, y ningun test lo veia porque el mock no ejecuta fisica.
  it("todo parlante publica DI en las seis bandas", () => {
    for (const { brand, model, spec } of SPEAKERS) {
      const di = spec.directivity.diByBand;
      expect(Object.keys(di).length, `${brand} ${model}`).toBe(6);
    }
  });

  it("ningun DI es negativo: en campo libre Q >= 1", () => {
    // La formula Q = 41253/(H*V) sobre la cobertura 360x360 de un subwoofer daria -4.97 dB, que
    // es fisicamente imposible. El tope de derive.ts es lo que lo impide.
    for (const { brand, model, spec } of SPEAKERS) {
      for (const [band, value] of Object.entries(spec.directivity.diByBand)) {
        expect(value, `${brand} ${model} @ ${band} Hz`).toBeGreaterThanOrEqual(
          0,
        );
      }
    }
  });

  it("un subwoofer es omnidireccional en todas las bandas", () => {
    for (const { brand, model, spec } of SPEAKERS) {
      if (spec.kind !== "subwoofer") continue;
      for (const [band, value] of Object.entries(spec.directivity.diByBand)) {
        expect(value, `${brand} ${model} @ ${band} Hz`).toBe(0);
      }
    }
  });

  // El ancla de la derivacion. La PRX812 es la unica ficha del catalogo que publica el DI como
  // cifra (10.2 dB), asi que es el unico contraste posible entre lo que dice el fabricante y lo
  // que da la formula sobre su cobertura. Si se transcriben mas, este test los cubre solos.
  it("la formula reproduce el DI publicado dentro de 1 dB", () => {
    const TOLERANCE_DB = 1;
    const published = SPEAKERS.filter(({ spec }) =>
      String(spec.dataSource).includes("DI publicado"),
    );
    expect(published.length, "el ancla desaparecio del seed").toBeGreaterThan(
      0,
    );

    for (const { brand, model, spec } of published) {
      const { hDeg, vDeg } = spec.directivity.nominalCoverage;
      const derived = directivityIndexDb(hDeg, vDeg);
      const declared = spec.directivity.diByBand["1000"];
      expect(declared, `${brand} ${model}`).toBeDefined();
      expect(
        Math.abs(derived - (declared as number)),
        `${brand} ${model}: derivado ${derived} vs publicado ${declared}`,
      ).toBeLessThanOrEqual(TOLERANCE_DB);
    }
  });

  it("toda fuente declara un rango de fundamentales creciente", () => {
    for (const spec of SOURCES) {
      const [low, high] = spec.fundamentalRangeHz;
      expect(low, spec.name).toBeGreaterThan(0);
      expect(high, spec.name).toBeGreaterThan(low);
    }
  });
});
