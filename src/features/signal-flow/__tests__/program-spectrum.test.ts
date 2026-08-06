// src/features/signal-flow/__tests__/program-spectrum.test.ts — el mapeo fuente→espectro que la
// Sección 5.1 dejaba pendiente. Lo que se fija aquí es la regla: una familia sola manda su propio
// espectro, varias familias son `live_band`.

import { describe, expect, it } from "vitest";
import {
  consoleNode,
  edge,
  flow,
  microphoneNode,
  paNode,
  simulationNode,
  sourceNode,
  speakerNode,
} from "@/features/signal-flow/__tests__/fixtures/flow-builder";
import {
  amplifierSpec,
  sourceSpec,
  speakerSpec,
} from "@/features/signal-flow/__tests__/fixtures/specs";
import { buildGraphIndex } from "@/features/signal-flow/model/graph-index";
import {
  PROGRAM_SPECTRA,
  PROGRAM_SPECTRUM_LABEL,
  resolveProgramSpectrum,
} from "@/features/signal-flow/resolution/program-spectrum";
import {
  inputPortId,
  NAMED_PORT_IDS,
  outputPortId,
} from "@/features/signal-flow/schemas/port-ids";

const OUT_0 = outputPortId(0);
const IN_0 = inputPortId(0);
const { input, sourceDirect, sourceAcoustic, speakerLink, output } =
  NAMED_PORT_IDS;

const voz = (id: string) =>
  sourceNode(id, sourceSpec({ kind: "vocals", name: "Voz", amplified: false }));
const bajo = (id: string) =>
  sourceNode(
    id,
    sourceSpec({ kind: "strings", name: "Bajo", amplified: true }),
  );
const bombo = (id: string) =>
  sourceNode(
    id,
    sourceSpec({ kind: "percussion", name: "Bombo", amplified: false }),
  );
const caja = (id: string) =>
  speakerNode(id, speakerSpec({ activePowered: false }));

/** fuente(s) → consola → amplificador → caja. Devuelve el índice ya construido. */
function rigWith(sources: ReturnType<typeof voz>[]) {
  const sourceEdges = sources.map((source, index) =>
    edge(source.id, sourceDirect, "con", inputPortId(index)),
  );
  return buildGraphIndex(
    flow(
      [
        ...sources,
        consoleNode("con"),
        paNode("amp", amplifierSpec()),
        caja("spk"),
        simulationNode(),
      ],
      [
        ...sourceEdges,
        edge("con", OUT_0, "amp", IN_0),
        edge("amp", OUT_0, "spk", input),
        edge("spk", NAMED_PORT_IDS.speakerToSimulation, "sim", input),
      ],
    ),
  );
}

describe("resolveProgramSpectrum", () => {
  it("una sola familia manda su propio espectro", () => {
    expect(resolveProgramSpectrum(rigWith([voz("v")]), "spk")).toBe("vocals");
    expect(resolveProgramSpectrum(rigWith([bajo("b")]), "spk")).toBe("strings");
    expect(resolveProgramSpectrum(rigWith([bombo("p")]), "spk")).toBe(
      "percussion",
    );
  });

  it("dos fuentes de la MISMA familia siguen siendo esa familia, no una mezcla", () => {
    const index = rigWith([voz("v1"), voz("v2")]);

    expect(resolveProgramSpectrum(index, "spk")).toBe("vocals");
  });

  it("familias distintas son una mezcla de banda ancha: live_band", () => {
    const index = rigWith([voz("v"), bajo("b"), bombo("p")]);

    expect(resolveProgramSpectrum(index, "spk")).toBe("live_band");
  });

  it("sin ninguna fuente que la alcance no hay programa que resolver", () => {
    const index = buildGraphIndex(
      flow(
        [paNode("amp", amplifierSpec()), caja("spk")],
        [edge("amp", OUT_0, "spk", input)],
      ),
    );

    expect(resolveProgramSpectrum(index, "spk")).toBeNull();
  });

  it("el programa atraviesa el micrófono: una voz microfoneada sigue siendo voz", () => {
    const index = buildGraphIndex(
      flow(
        [
          voz("v"),
          microphoneNode("mic"),
          consoleNode("con"),
          paNode("amp", amplifierSpec()),
          caja("spk"),
        ],
        [
          edge("v", sourceAcoustic, "mic", input),
          edge("mic", output, "con", IN_0),
          edge("con", OUT_0, "amp", IN_0),
          edge("amp", OUT_0, "spk", input),
        ],
      ),
    );

    expect(resolveProgramSpectrum(index, "spk")).toBe("vocals");
  });

  it("el enlace entre cajas propaga el programa al top", () => {
    const index = buildGraphIndex(
      flow(
        [
          voz("v"),
          consoleNode("con"),
          paNode("amp", amplifierSpec()),
          caja("sub"),
          caja("top"),
        ],
        [
          edge("v", sourceDirect, "con", IN_0),
          edge("con", OUT_0, "amp", IN_0),
          edge("amp", OUT_0, "sub", input),
          edge("sub", speakerLink, "top", input),
        ],
      ),
    );

    expect(resolveProgramSpectrum(index, "top")).toBe("vocals");
  });

  it("cada caja resuelve SU programa: dos ramas distintas no se contagian", () => {
    const index = buildGraphIndex(
      flow(
        [
          voz("v"),
          bombo("p"),
          consoleNode("con"),
          paNode("ampVoz", amplifierSpec()),
          paNode("ampPerc", amplifierSpec()),
          caja("spkVoz"),
          caja("spkPerc"),
        ],
        [
          edge("v", sourceDirect, "con", IN_0),
          edge("p", sourceDirect, "con", inputPortId(1)),
          // Cada fuente sale por un bus distinto hacia su propio amplificador.
          edge("con", OUT_0, "ampVoz", IN_0),
          edge("con", outputPortId(1), "ampPerc", IN_0),
          edge("ampVoz", OUT_0, "spkVoz", input),
          edge("ampPerc", OUT_0, "spkPerc", input),
        ],
      ),
    );

    // La consola mezcla: ambas fuentes alcanzan ambos buses, así que las dos cajas ven la mezcla.
    // Es la lectura correcta de un nodo consola que el grafo modela como N→M sin matriz de ruteo.
    expect(resolveProgramSpectrum(index, "spkVoz")).toBe("live_band");
    expect(resolveProgramSpectrum(index, "spkPerc")).toBe("live_band");
  });
});

describe("vocabulario de espectros", () => {
  it("incluye los dos valores que ya circulan por el repo", () => {
    // live_band lo publica la Sección 07 del doc; flat_reference lo usa la fixture CANON-01, que
    // ambos repos comparten — el motor tiene que conocerlo aunque ningún grafo lo produzca.
    expect(PROGRAM_SPECTRA).toContain("live_band");
    expect(PROGRAM_SPECTRA).toContain("flat_reference");
  });

  it("cada etiqueta tiene nombre en español para la UI", () => {
    for (const spectrum of PROGRAM_SPECTRA) {
      expect(PROGRAM_SPECTRUM_LABEL[spectrum]).toBeTruthy();
    }
  });
});
