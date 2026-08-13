// src/features/simulation/__tests__/scene-instruments.test.ts — los instrumentos de la escena.
//
// Lo que se protege es que salgan TODOS los del grafo y solo los del grafo. El requisito es una
// tarjeta por instrumento —también para los que no tienen ningún problema—, así que un filtro de
// más aquí se traduce en un canal que desaparece de la pantalla sin decir por qué.

import { describe, expect, it } from "vitest";
import type { SignalFlowDocument } from "@/features/signal-flow/schemas/signal-flow";
import {
  describeInstruments,
  sourceNodesOf,
} from "@/features/simulation/model/scene-instruments";

function flow(nodes: SignalFlowDocument["nodes"]): SignalFlowDocument {
  return {
    schemaVersion: "1",
    nodes,
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

const POSITION = { x: 0, y: 0 };

const VOICE_SPEC = {
  schemaVersion: "1",
  kind: "vocals",
  name: "Voz masculina",
  fundamentalRangeHz: [85, 180],
  harmonics: "Formantes hasta 8 kHz.",
  acousticPower: "medium",
  amplified: false,
};

describe("sourceNodesOf", () => {
  it("saca solo los nodos source, con su modo de salida", () => {
    const nodes = sourceNodesOf(
      flow([
        {
          id: "voz",
          position: POSITION,
          data: { kind: "source", catalogItemId: "cat-1", outputMode: "mono" },
        },
        {
          id: "piano",
          position: POSITION,
          data: {
            kind: "source",
            catalogItemId: "cat-2",
            outputMode: "stereo",
          },
        },
        { id: "sim", position: POSITION, data: { kind: "simulation" } },
        {
          id: "caja",
          position: POSITION,
          data: {
            kind: "speaker",
            catalogItemId: "cat-9",
            levelDb: 0,
            polarityInverted: false,
            delayMs: 0,
          },
        },
      ]),
    );

    expect(nodes.map((node) => node.nodeId)).toEqual(["voz", "piano"]);
    expect(nodes[1].outputMode).toBe("stereo");
  });

  // Un nodo recién soltado en el lienzo todavía no es un instrumento del que se pueda decir nada.
  it("descarta el nodo al que aún no se le ha elegido ítem de catálogo", () => {
    const nodes = sourceNodesOf(
      flow([
        {
          id: "vacio",
          position: POSITION,
          data: { kind: "source", catalogItemId: null, outputMode: "mono" },
        },
      ]),
    );

    expect(nodes).toEqual([]);
  });
});

describe("describeInstruments", () => {
  const node = {
    nodeId: "voz",
    catalogItemId: "cat-1",
    outputMode: "mono" as const,
  };

  it("junta el nodo con su fila de catálogo", () => {
    const [instrument] = describeInstruments(
      [node],
      [
        {
          id: "cat-1",
          name: "Voz masculina",
          category: "vocals",
          spec: VOICE_SPEC,
        },
      ],
    );

    expect(instrument.nodeId).toBe("voz");
    expect(instrument.name).toBe("Voz masculina");
    expect(instrument.amplified).toBe(false);
    expect(instrument.fundamentalRangeHz).toEqual([85, 180]);
  });

  // El spec ilegible no debe tirar la fila: el nombre y la categoría ya bastan para pedir consejo.
  it("sobrevive a un spec que no parsea", () => {
    const [instrument] = describeInstruments(
      [node],
      [{ id: "cat-1", name: "Voz", category: "vocals", spec: { roto: true } }],
    );

    expect(instrument.name).toBe("Voz");
    expect(instrument.harmonics).toBeNull();
    expect(instrument.amplified).toBeNull();
  });

  it("descarta el nodo cuyo ítem ya no está en el catálogo", () => {
    expect(describeInstruments([node], [])).toEqual([]);
  });
});
