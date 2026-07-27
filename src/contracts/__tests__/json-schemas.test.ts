// src/contracts/__tests__/json-schemas.test.ts — red de seguridad de los contratos v1.
// Los .schema.json son el artefacto que se copia a aura-engine; si se desincronizan de los
// zod que los generan, o si dejan de aceptar CANON-01, el build tiene que romperse aquí y
// no cuando el motor rechace un payload en producción (Sección 07).

import { readFileSync } from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020";
import { describe, expect, it } from "vitest";
import canonExpected from "@/contracts/fixtures/canon-01.expected.json";
import canonRequest from "@/contracts/fixtures/canon-01.request.json";
import { CONTRACTS, toContractJsonSchema } from "@/contracts/registry";

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
});
