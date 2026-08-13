// src/features/simulation/__tests__/mix-advice.test.ts — la respuesta de la IA entra validada.
//
// Esto NO es determinista: lo que se protege es que una respuesta rara del modelo se rechace entera
// en vez de pintar un plugin con huecos. Un filtro sin Q o una reverb al 90 % no son "casi bien".

import { describe, expect, it } from "vitest";
import { parseMixAdvice } from "@/features/simulation/schemas/mix-advice";

const BAND = {
  band: 1,
  frequencyHz: 4000,
  gainDb: 5.2,
  q: 1.41,
  filterType: "peak",
  description: "Devuelve el aire que la sala se come.",
};

const REVERB = {
  type: "room",
  timeMs: 900,
  preDelayMs: 20,
  mixPercent: 12,
  description: "Corto: la sala ya aporta cola.",
};

const COMPRESSION = {
  thresholdDb: -18,
  ratio: 3,
  attackMs: 10,
  releaseMs: 120,
  makeupGainDb: 3,
  description: "Control suave de dinámica.",
};

function advice(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    roomEq: { bands: [BAND], description: "Corrección de sala." },
    instruments: [
      {
        instrumentId: "node-1",
        instrumentName: "Voz masculina",
        eq: { bands: [BAND], description: "Presencia." },
        reverb: REVERB,
        compression: COMPRESSION,
      },
    ],
    summary: "Sala viva, poca energía en agudos.",
    ...overrides,
  });
}

describe("parseMixAdvice", () => {
  it("acepta una respuesta bien formada", () => {
    const result = parseMixAdvice(advice());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.instruments[0].instrumentName).toBe("Voz masculina");
      expect(result.data.instruments[0].compression.ratio).toBe(3);
    }
  });

  it("quita el bloque markdown con el que el modelo envuelve el JSON", () => {
    expect(parseMixAdvice(`\`\`\`json\n${advice()}\n\`\`\``).ok).toBe(true);
  });

  it("rechaza lo que no es JSON en vez de romper", () => {
    const result = parseMixAdvice("Claro, aquí tienes tu ecualización:");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("JSON válido");
  });

  // El modelo inventa ganancias imposibles con más frecuencia de la que parece.
  it("rechaza una ganancia fuera del rango de un paramétrico real", () => {
    const broken = JSON.parse(advice());
    broken.instruments[0].eq.bands[0].gainDb = 48;

    expect(parseMixAdvice(JSON.stringify(broken)).ok).toBe(false);
  });

  it("rechaza una reverb con mezcla imposible", () => {
    const broken = JSON.parse(advice());
    broken.instruments[0].reverb.mixPercent = 90;

    expect(parseMixAdvice(JSON.stringify(broken)).ok).toBe(false);
  });

  it("rechaza una banda a la que le falta la Q", () => {
    const broken = JSON.parse(advice());
    broken.instruments[0].eq.bands[0].q = undefined;

    expect(parseMixAdvice(JSON.stringify(broken)).ok).toBe(false);
  });
});
