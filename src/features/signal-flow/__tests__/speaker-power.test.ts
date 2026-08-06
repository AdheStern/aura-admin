// src/features/signal-flow/__tests__/speaker-power.test.ts — los vatios que acaban en
// electricalPowerW. Es física, así que se prueba como física: casos con número exacto conocido más
// las dos propiedades que tienen que cumplirse siempre (las partes suman el total; a igual tensión
// la potencia va como 1/Z).

import { describe, expect, it } from "vitest";
import {
  edge,
  flow,
  paNode,
  speakerNode,
} from "@/features/signal-flow/__tests__/fixtures/flow-builder";
import {
  amplifierSpec,
  processorSpec,
  speakerSpec,
} from "@/features/signal-flow/__tests__/fixtures/specs";
import { buildGraphIndex } from "@/features/signal-flow/model/graph-index";
import { resolveSpeakerPower } from "@/features/signal-flow/resolution/speaker-power";
import {
  NAMED_PORT_IDS,
  outputPortId,
} from "@/features/signal-flow/schemas/port-ids";

const OUT_0 = outputPortId(0);
const { input, speakerLink } = NAMED_PORT_IDS;

// Crown XLS 1502 del seed: 300 W @ 8 Ω, 525 W @ 4 Ω.
const AMP = () => amplifierSpec({ "8": 300, "4": 525, "2": 775 });

const passive = (id: string, impedanceOhm = 8, continuousW = 400) =>
  speakerNode(
    id,
    speakerSpec({ activePowered: false, impedanceOhm, continuousW }),
  );
const active = (id: string, continuousW = 800) =>
  speakerNode(id, speakerSpec({ activePowered: true, continuousW }));

function wattsOf(
  index: ReturnType<typeof buildGraphIndex>,
  id: string,
): number {
  const power = resolveSpeakerPower(index, id);
  if (!power.ok)
    throw new Error(`No resolvió la potencia de ${id}: ${power.reason}`);
  return power.watts;
}

describe("resolveSpeakerPower · caja pasiva", () => {
  it("una sola caja de 8 Ω recibe los 300 W que el canal declara a esa carga", () => {
    const index = buildGraphIndex(
      flow(
        [paNode("amp", AMP()), passive("a")],
        [edge("amp", OUT_0, "a", input)],
      ),
    );

    expect(wattsOf(index, "a")).toBe(300);
  });

  it("dos cajas de 8 Ω dejan el canal en 4 Ω y se reparten sus 525 W a la mitad", () => {
    const index = buildGraphIndex(
      flow(
        [paNode("amp", AMP()), passive("a"), passive("b")],
        [edge("amp", OUT_0, "a", input), edge("amp", OUT_0, "b", input)],
      ),
    );

    expect(wattsOf(index, "a")).toBe(262.5);
    expect(wattsOf(index, "b")).toBe(262.5);
  });

  it("encadenar por el enlace da el mismo resultado que abrir el canal: es el mismo paralelo", () => {
    const index = buildGraphIndex(
      flow(
        [paNode("amp", AMP()), passive("sub"), passive("top")],
        [
          edge("amp", OUT_0, "sub", input),
          edge("sub", speakerLink, "top", input),
        ],
      ),
    );

    expect(wattsOf(index, "sub")).toBe(262.5);
    expect(wattsOf(index, "top")).toBe(262.5);
  });

  it("con impedancias distintas la caja de 4 Ω se lleva el doble que la de 8 Ω", () => {
    // 8 ∥ 4 = 2.67 Ω → el amplificador entrega sus 775 W de la carga de 2 Ω (la más cercana).
    const index = buildGraphIndex(
      flow(
        [paNode("amp", AMP()), passive("ocho", 8), passive("cuatro", 4)],
        [
          edge("amp", OUT_0, "ocho", input),
          edge("amp", OUT_0, "cuatro", input),
        ],
      ),
    );

    const ocho = wattsOf(index, "ocho");
    const cuatro = wattsOf(index, "cuatro");

    expect(cuatro / ocho).toBeCloseTo(2, 10);
    expect(ocho + cuatro).toBeCloseTo(775, 10);
  });

  it("las partes siempre suman la potencia del canal, sea cual sea el número de cajas", () => {
    const index = buildGraphIndex(
      flow(
        [paNode("amp", AMP()), passive("a"), passive("b"), passive("c")],
        [
          edge("amp", OUT_0, "a", input),
          edge("amp", OUT_0, "b", input),
          edge("b", speakerLink, "c", input),
        ],
      ),
    );

    const total =
      wattsOf(index, "a") + wattsOf(index, "b") + wattsOf(index, "c");

    // 3 × 8 Ω = 2.67 Ω → carga declarada más cercana: 2 Ω → 775 W. La igualdad es exacta salvo
    // épsilon de coma flotante: la resolución no redondea, justo para que esto se cumpla.
    expect(total).toBeCloseTo(775, 10);
  });

  it("cada canal es independiente: abrir el segundo no baja la potencia del primero", () => {
    const index = buildGraphIndex(
      flow(
        [paNode("amp", AMP()), passive("a"), passive("b")],
        [
          edge("amp", OUT_0, "a", input),
          edge("amp", outputPortId(1), "b", input),
        ],
      ),
    );

    expect(wattsOf(index, "a")).toBe(300);
    expect(wattsOf(index, "b")).toBe(300);
  });
});

describe("resolveSpeakerPower · caja activa", () => {
  it("usa la potencia continua de su propia etapa, no la del grafo", () => {
    const index = buildGraphIndex(
      flow(
        [paNode("dbx", processorSpec()), active("top", 800)],
        [edge("dbx", OUT_0, "top", input)],
      ),
    );

    const power = resolveSpeakerPower(index, "top");

    expect(power).toEqual({
      ok: true,
      watts: 800,
      origin: { kind: "active_stage" },
    });
  });

  it("dos activas en el mismo canal de línea no se reparten nada: cada una trae su etapa", () => {
    const index = buildGraphIndex(
      flow(
        [paNode("dbx", processorSpec()), active("a", 800), active("b", 800)],
        [edge("dbx", OUT_0, "a", input), edge("dbx", OUT_0, "b", input)],
      ),
    );

    expect(wattsOf(index, "a")).toBe(800);
    expect(wattsOf(index, "b")).toBe(800);
  });
});

describe("resolveSpeakerPower · lo que no se puede resolver", () => {
  it("una pasiva sin amplificador no tiene potencia que calcular", () => {
    const index = buildGraphIndex(flow([passive("a")]));

    expect(resolveSpeakerPower(index, "a")).toEqual({
      ok: false,
      reason: "SPEAKER_WITHOUT_POWER",
    });
  });

  it("una activa sin línea tampoco", () => {
    const index = buildGraphIndex(flow([active("a")]));

    expect(resolveSpeakerPower(index, "a")).toEqual({
      ok: false,
      reason: "SPEAKER_WITHOUT_SIGNAL",
    });
  });

  it("una carga por debajo del mínimo declarado no se extrapola: se declara irresoluble", () => {
    const soloOcho = amplifierSpec({ "8": 300, "4": 525 });
    const index = buildGraphIndex(
      flow(
        [paNode("amp", soloOcho), passive("a"), passive("b"), passive("c")],
        [
          edge("amp", OUT_0, "a", input),
          edge("amp", OUT_0, "b", input),
          edge("amp", OUT_0, "c", input),
        ],
      ),
    );

    expect(resolveSpeakerPower(index, "a")).toEqual({
      ok: false,
      reason: "AMP_LOAD_UNSUPPORTED",
    });
  });

  it("sin datasheet no hay impedancia con la que repartir", () => {
    const broken = {
      ...passive("a"),
      specStatus: "item_missing" as const,
      spec: null,
    };
    const index = buildGraphIndex(flow([paNode("amp", AMP()), broken]));

    expect(resolveSpeakerPower(index, "a")).toEqual({
      ok: false,
      reason: "NODE_WITHOUT_CATALOG_ITEM",
    });
  });
});
