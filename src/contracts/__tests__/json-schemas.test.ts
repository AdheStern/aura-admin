// src/contracts/__tests__/json-schemas.test.ts — red de seguridad de los contratos v1.
// Los .schema.json son el artefacto que se copia a aura-engine; si se desincronizan de los
// zod que los generan, o si dejan de aceptar CANON-01, el build tiene que romperse aquí y
// no cuando el motor rechace un payload en producción (Sección 07).

import { readFileSync } from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import { amplifierSpecSchema } from "@/contracts/amplifier-spec.schema";
import {
  EXAMPLE_AMPLIFIER_SPEC,
  EXAMPLE_CONSOLE_SPEC,
  EXAMPLE_MATERIAL_SPEC,
  EXAMPLE_MICROPHONE_SPEC,
  EXAMPLE_PROCESSOR_SPEC,
  EXAMPLE_SOURCE_SPEC,
  EXAMPLE_SPEAKER_SPEC,
} from "@/contracts/examples";
import canonExpected from "@/contracts/fixtures/canon-01.expected.json";
import canonRequest from "@/contracts/fixtures/canon-01.request.json";
import { CONTRACTS, toContractJsonSchema } from "@/contracts/registry";

/** Los ejemplos que siembran los formularios de alta, con el schema que deben satisfacer. */
const CATALOG_EXAMPLES = [
  ["speaker-spec.schema.json", EXAMPLE_SPEAKER_SPEC],
  ["material-spec.schema.json", EXAMPLE_MATERIAL_SPEC],
  ["microphone-spec.schema.json", EXAMPLE_MICROPHONE_SPEC],
  ["console-spec.schema.json", EXAMPLE_CONSOLE_SPEC],
  ["amplifier-spec.schema.json", EXAMPLE_AMPLIFIER_SPEC],
  ["amplifier-spec.schema.json", EXAMPLE_PROCESSOR_SPEC],
  ["source-spec.schema.json", EXAMPLE_SOURCE_SPEC],
] as const;

const CONTRACTS_DIR = path.join(process.cwd(), "src", "contracts");

function readCheckedInSchema(fileName: string): unknown {
  return JSON.parse(readFileSync(path.join(CONTRACTS_DIR, fileName), "utf8"));
}

function compile(fileName: string) {
  // strict:false — z.toJSONSchema combina propertyNames + additionalProperties en los
  // records por banda, algo válido en draft 2020-12 que el modo estricto de ajv señala.
  return new Ajv2020({ strict: false }).compile(
    readCheckedInSchema(fileName) as object,
  );
}

describe("JSON Schemas v1", () => {
  it.each(CONTRACTS.map((c) => [c.fileName, c] as const))(
    "%s está sincronizado con su contrato zod",
    (fileName, contract) => {
      expect(readCheckedInSchema(fileName)).toEqual(
        toContractJsonSchema(contract),
      );
    },
  );

  it.each(CONTRACTS.map((c) => c.fileName))(
    "%s es un JSON Schema compilable",
    (fileName) => {
      expect(() => compile(fileName)).not.toThrow();
    },
  );

  it("declara un $id estable y versionado por contrato", () => {
    const ids = CONTRACTS.map(
      (c) => (readCheckedInSchema(c.fileName) as { $id: string }).$id,
    );
    expect(new Set(ids).size).toBe(CONTRACTS.length);
    for (const id of ids) expect(id).toMatch(/^urn:aura:contracts:v1:/);
  });

  // Los formularios de alta siembran el textarea con estos ejemplos: si uno deja de validar,
  // el administrador recibiría un error al guardar un datasheet que la app le precargó.
  it.each(CATALOG_EXAMPLES)("el ejemplo de %s valida", (fileName, example) => {
    const validate = compile(fileName);
    expect(validate(example), JSON.stringify(validate.errors, null, 2)).toBe(
      true,
    );
  });
});

describe("CANON-01 contra los JSON Schemas", () => {
  it("el request valida como SimulationRequest v1", () => {
    const validate = compile("simulation-request.schema.json");
    expect(
      validate(canonRequest),
      JSON.stringify(validate.errors, null, 2),
    ).toBe(true);
  });

  it("el expected valida como SimulationResult v1", () => {
    const validate = compile("simulation-result.schema.json");
    expect(
      validate(canonExpected),
      JSON.stringify(validate.errors, null, 2),
    ).toBe(true);
  });

  it("rechaza un request con schemaVersion desconocida", () => {
    const validate = compile("simulation-request.schema.json");
    expect(validate({ ...canonRequest, schemaVersion: "2" })).toBe(false);
  });

  it("rechaza una geometría sin zona de audiencia", () => {
    const validate = compile("room-geometry.schema.json");
    const room = {
      ...canonRequest.room,
      zones: { ...canonRequest.room.zones, audience: [] },
    };
    expect(validate(room)).toBe(false);
  });
});

// z.object() SILENCIA los campos desconocidos en vez de rechazarlos, y entonces no emite
// additionalProperties: false. Estos casos fijan la decisión estricto/laxo de cada contrato
// para que un z.strictObject() cambiado por descuido rompa aquí y no en producción.
describe("Estricto vs. laxo", () => {
  it("el request rechaza un campo desconocido", () => {
    const validate = compile("simulation-request.schema.json");
    expect(validate({ ...canonRequest, campoInventado: 1 })).toBe(false);
  });

  it("el catálogo acepta un campo desconocido (tolerancia hacia adelante)", () => {
    const validate = compile("material-spec.schema.json");
    const material = { ...canonRequest.materials.mat_canon, campoFuturo: "x" };
    expect(validate(material), JSON.stringify(validate.errors, null, 2)).toBe(
      true,
    );
  });

  it("el resultado acepta métricas de un motor más nuevo", () => {
    const validate = compile("simulation-result.schema.json");
    const result = {
      ...canonExpected,
      summary: { ...canonExpected.summary, stiAvg: 0.62 },
    };
    expect(validate(result), JSON.stringify(validate.errors, null, 2)).toBe(
      true,
    );
  });

  it("rechaza una banda fuera de las seis normativas", () => {
    const validate = compile("simulation-request.schema.json");
    expect(
      validate({
        ...canonRequest,
        config: { ...canonRequest.config, bands: [8000] },
      }),
    ).toBe(false);
  });

  it("rechaza un α fuera del rango físico", () => {
    const validate = compile("material-spec.schema.json");
    const material = structuredClone(canonRequest.materials.mat_canon);
    material.absorption["125"] = 5;
    expect(validate(material)).toBe(false);
  });

  it("los catálogos de equipo aceptan un campo desconocido", () => {
    for (const [fileName, example] of CATALOG_EXAMPLES) {
      const validate = compile(fileName);
      expect(validate({ ...example, campoFuturo: "x" }), fileName).toBe(true);
    }
  });
});

// Los handles de los nodos console y pa salen de estos campos (Sección 5.1), así que un conteo
// inválido no es un dato feo: es un grafo de señal imposible de dibujar.
describe("Contratos de equipo: handles y potencia", () => {
  it("la consola rechaza un conteo de canales no entero o nulo", () => {
    const validate = compile("console-spec.schema.json");
    const io = EXAMPLE_CONSOLE_SPEC.io;
    expect(
      validate({ ...EXAMPLE_CONSOLE_SPEC, io: { ...io, inputChannels: 0 } }),
    ).toBe(false);
    expect(
      validate({ ...EXAMPLE_CONSOLE_SPEC, io: { ...io, outputBuses: 2.5 } }),
    ).toBe(false);
  });

  it("el amplificador exige la potencia a 8Ω y deja el resto opcional", () => {
    const validate = compile("amplifier-spec.schema.json");
    expect(
      validate({ ...EXAMPLE_AMPLIFIER_SPEC, powerPerChannelW: { "8": 500 } }),
    ).toBe(true);
    expect(
      validate({ ...EXAMPLE_AMPLIFIER_SPEC, powerPerChannelW: { "4": 750 } }),
    ).toBe(false);
  });

  // La unión discriminada existe justo para esto: el gestor de altavoces comparte nodo con el
  // amplificador pero no entrega vatios, y exigirle potencia lo dejaría fuera del catálogo.
  it("el procesador vale sin potencia, el amplificador no", () => {
    const validate = compile("amplifier-spec.schema.json");
    const { powerPerChannelW: _omitida, ...ampSinPotencia } =
      EXAMPLE_AMPLIFIER_SPEC;

    expect(
      validate(EXAMPLE_PROCESSOR_SPEC),
      JSON.stringify(validate.errors, null, 2),
    ).toBe(true);
    expect(validate(ampSinPotencia)).toBe(false);
  });

  // Trampa para Fase 2: la variante processor es laxa (regla 3 de ingesta), así que un
  // powerPerChannelW sobrante se TOLERA como campo desconocido en vez de rechazarse. Quien
  // resuelva el grafo debe mirar `kind` para decidir si hay potencia, nunca la mera presencia
  // del campo — este caso fija ese comportamiento para que nadie lo descubra depurando.
  it("un procesador con potencia sobrante se acepta, pero sigue siendo processor", () => {
    const validate = compile("amplifier-spec.schema.json");
    const conSobrante = {
      ...EXAMPLE_PROCESSOR_SPEC,
      powerPerChannelW: { "8": 500 },
    };
    expect(validate(conSobrante)).toBe(true);
    expect(amplifierSpecSchema.parse(conSobrante).kind).toBe("processor");
  });

  it("rechaza un kind de amplificador desconocido", () => {
    const validate = compile("amplifier-spec.schema.json");
    expect(validate({ ...EXAMPLE_AMPLIFIER_SPEC, kind: "no_existe" })).toBe(
      false,
    );
  });

  it("la fuente exige rango de fundamentales y clase de energía", () => {
    const validate = compile("source-spec.schema.json");
    const { acousticPower: _omitida, ...sinPotencia } = EXAMPLE_SOURCE_SPEC;
    expect(validate(sinPotencia)).toBe(false);
    expect(
      validate({ ...EXAMPLE_SOURCE_SPEC, fundamentalRangeHz: [0, 250] }),
    ).toBe(false);
  });

  it("el micrófono exige al menos dos puntos de curva para poder graficarla", () => {
    const validate = compile("microphone-spec.schema.json");
    const frequencyResponse = {
      ...EXAMPLE_MICROPHONE_SPEC.frequencyResponse,
      curve: [[1000, 0]],
    };
    expect(validate({ ...EXAMPLE_MICROPHONE_SPEC, frequencyResponse })).toBe(
      false,
    );
  });

  it("el micrófono acepta que falte selfNoise (los dinámicos no lo publican)", () => {
    const validate = compile("microphone-spec.schema.json");
    const { selfNoise: _omitted, ...withoutSelfNoise } =
      EXAMPLE_MICROPHONE_SPEC;
    expect(
      validate(withoutSelfNoise),
      JSON.stringify(validate.errors, null, 2),
    ).toBe(true);
  });
});
