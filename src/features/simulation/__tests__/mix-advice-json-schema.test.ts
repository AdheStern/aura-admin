// src/features/simulation/__tests__/mix-advice-json-schema.test.ts — el esquema que viaja al proveedor.
//
// Se protege lo que costó un 400 seco y un fallo intermitente: que no queden referencias (`$ref`)
// ni palabras clave que el validador de Gemini rechaza, y que la estructura siga saliendo del zod
// —no de una copia a mano que se quedaría atrás el día que el consejo gane un campo.

import { describe, expect, it } from "vitest";
import { mixAdviceJsonSchema } from "@/features/simulation/schemas/mix-advice-json-schema";

const schema = mixAdviceJsonSchema();
const serialised = JSON.stringify(schema);

describe("mixAdviceJsonSchema", () => {
  it("no lleva referencias: Gemini las rechaza con un 400 sin explicación", () => {
    expect(serialised).not.toContain("$ref");
    expect(serialised).not.toContain("$defs");
  });

  it("no lleva los rangos que el validador no admite", () => {
    for (const keyword of [
      "minimum",
      "maximum",
      "maxItems",
      "additionalProperties",
    ]) {
      expect(serialised).not.toContain(`"${keyword}"`);
    }
  });

  it("conserva la estructura: es lo único que se le pide al proveedor", () => {
    const properties = schema.properties as Record<
      string,
      Record<string, unknown>
    >;

    expect(schema.required).toEqual(
      expect.arrayContaining(["roomEq", "instruments", "summary"]),
    );
    expect(properties.instruments.type).toBe("array");

    const instrument = (properties.instruments.items as Record<string, unknown>)
      .properties as Record<string, unknown>;
    expect(Object.keys(instrument)).toEqual(
      expect.arrayContaining([
        "instrumentId",
        "level",
        "eq",
        "reverb",
        "compression",
      ]),
    );
  });

  // Sin el nivel en el esquema el modelo se lo salta y la mesa sale vacía.
  it("lleva el nivel con sus dos mandos", () => {
    const instruments = (
      schema.properties as Record<string, Record<string, unknown>>
    ).instruments;
    const level = (
      (instruments.items as Record<string, Record<string, unknown>>).properties
        .level as Record<string, unknown>
    ).properties as Record<string, unknown>;

    expect(Object.keys(level)).toEqual(
      expect.arrayContaining(["gainDb", "panPercent", "description"]),
    );
  });

  // Sin el enum el modelo inventa tipos de filtro y parseMixAdvice tira la respuesta entera.
  it("mantiene los enums de tipo de filtro y de reverb", () => {
    expect(serialised).toContain("low_shelf");
    expect(serialised).toContain("high_pass");
    expect(serialised).toContain("plate");
  });
});
