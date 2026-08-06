// src/features/signal-flow/__tests__/resolve-speaker-feed.test.ts — la topología eléctrica que
// hereda la tarea 3. Lo que se comprueba aquí es que el grafo sabe decir de dónde salen los vatios
// y con cuántas cajas se reparten: sin eso no hay electricalPowerW que compilar.

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
import { resolveSpeakerFeed } from "@/features/signal-flow/resolution/resolve-speaker-feed";
import {
  inputPortId,
  NAMED_PORT_IDS,
  outputPortId,
  portChannelIndex,
} from "@/features/signal-flow/schemas/port-ids";

const OUT_0 = outputPortId(0);
const { input, speakerLink } = NAMED_PORT_IDS;
const passive = (id: string, impedanceOhm = 8) =>
  speakerNode(id, speakerSpec({ activePowered: false, impedanceOhm }));
const active = (id: string) =>
  speakerNode(id, speakerSpec({ activePowered: true }));

describe("resolveSpeakerFeed · cajas pasivas", () => {
  it("dos cajas de 8 Ω abiertas del mismo canal dejan la carga en 4 Ω", () => {
    const index = buildGraphIndex(
      flow(
        [paNode("amp", amplifierSpec()), passive("a"), passive("b")],
        [edge("amp", OUT_0, "a", input), edge("amp", OUT_0, "b", input)],
      ),
    );

    const feed = resolveSpeakerFeed(index, "a");

    expect(feed.kind).toBe("passive");
    if (feed.kind !== "passive") return;
    expect(feed.loadImpedanceOhm).toBe(4);
    expect(feed.parallelSpeakerIds.sort()).toEqual(["a", "b"]);
    expect(feed.ampNodeId).toBe("amp");
    expect(feed.ampPortId).toBe(OUT_0);
  });

  it("encadenar por el enlace da la misma carga que abrir el canal: es el mismo paralelo", () => {
    const index = buildGraphIndex(
      flow(
        [paNode("amp", amplifierSpec()), passive("sub"), passive("top")],
        [
          edge("amp", OUT_0, "sub", input),
          edge("sub", speakerLink, "top", input),
        ],
      ),
    );

    const feed = resolveSpeakerFeed(index, "top");

    expect(feed.kind).toBe("passive");
    if (feed.kind !== "passive") return;
    expect(feed.loadImpedanceOhm).toBe(4);
    expect(feed.parallelSpeakerIds.sort()).toEqual(["sub", "top"]);
  });

  it("tres cajas de 8 Ω bajan la carga a 2.67 Ω", () => {
    const index = buildGraphIndex(
      flow(
        [
          paNode("amp", amplifierSpec()),
          passive("a"),
          passive("b"),
          passive("c"),
        ],
        [
          edge("amp", OUT_0, "a", input),
          edge("amp", OUT_0, "b", input),
          edge("b", speakerLink, "c", input),
        ],
      ),
    );

    const feed = resolveSpeakerFeed(index, "c");

    expect(feed.kind === "passive" && feed.loadImpedanceOhm).toBe(2.67);
  });

  it("cada canal del amplificador es una carga independiente", () => {
    const index = buildGraphIndex(
      flow(
        [paNode("amp", amplifierSpec()), passive("a"), passive("b")],
        [
          edge("amp", OUT_0, "a", input),
          edge("amp", outputPortId(1), "b", input),
        ],
      ),
    );

    const feed = resolveSpeakerFeed(index, "a");

    expect(feed.kind === "passive" && feed.loadImpedanceOhm).toBe(8);
    expect(feed.kind === "passive" && feed.parallelSpeakerIds).toEqual(["a"]);
  });

  it("una caja pasiva colgada de un procesador no está alimentada: no entrega vatios", () => {
    const index = buildGraphIndex(
      flow(
        [paNode("dbx", processorSpec()), passive("a")],
        [edge("dbx", OUT_0, "a", input)],
      ),
    );

    expect(resolveSpeakerFeed(index, "a").kind).toBe("unfed");
  });

  it("una caja sin nada en la entrada queda sin alimentar", () => {
    const index = buildGraphIndex(flow([passive("a")]));

    expect(resolveSpeakerFeed(index, "a").kind).toBe("unfed");
  });
});

describe("resolveSpeakerFeed · cajas activas", () => {
  it("le basta con recibir línea del procesador", () => {
    const index = buildGraphIndex(
      flow(
        [paNode("dbx", processorSpec()), active("top")],
        [edge("dbx", OUT_0, "top", input)],
      ),
    );

    const feed = resolveSpeakerFeed(index, "top");

    expect(feed).toEqual({ kind: "active", lineFeedNodeId: "dbx" });
  });

  it("el thru de un sub activo alimenta al top", () => {
    const index = buildGraphIndex(
      flow(
        [active("sub"), active("top")],
        [edge("sub", speakerLink, "top", input)],
      ),
    );

    expect(resolveSpeakerFeed(index, "top")).toEqual({
      kind: "active",
      lineFeedNodeId: "sub",
    });
  });
});

describe("resolveSpeakerFeed · datos incompletos", () => {
  it("sin datasheet no se puede decidir si es activa o pasiva", () => {
    const index = buildGraphIndex(
      flow([
        {
          ...passive("a"),
          specStatus: "item_missing",
          spec: null,
        },
      ]),
    );

    expect(resolveSpeakerFeed(index, "a").kind).toBe("unknown");
  });

  it("no inventa una impedancia si otra caja del canal no tiene datasheet", () => {
    const broken = {
      ...passive("b"),
      specStatus: "item_missing" as const,
      spec: null,
    };
    const index = buildGraphIndex(
      flow(
        [paNode("amp", amplifierSpec()), passive("a"), broken],
        [edge("amp", OUT_0, "a", input), edge("amp", OUT_0, "b", input)],
      ),
    );

    const feed = resolveSpeakerFeed(index, "a");

    expect(feed.kind === "passive" && feed.loadImpedanceOhm).toBeNull();
  });

  it("un lazo entre enlaces no cuelga el recorrido", () => {
    const index = buildGraphIndex(
      flow(
        [passive("a"), passive("b")],
        [
          edge("a", speakerLink, "b", input),
          edge("b", speakerLink, "a", input),
        ],
      ),
    );

    expect(resolveSpeakerFeed(index, "a").kind).toBe("unfed");
  });
});

it("el índice del handle es el canal del aparato, que es lo que leerá la tarea 3", () => {
  const index = buildGraphIndex(
    flow(
      [
        paNode(
          "amp",
          amplifierSpec({ "8": 400 }, { inputChannels: 2, outputChannels: 4 }),
        ),
        passive("a"),
      ],
      [edge("amp", outputPortId(2), "a", input)],
    ),
  );

  const feed = resolveSpeakerFeed(index, "a");
  const ampPortId = feed.kind === "passive" ? feed.ampPortId : "";

  expect(ampPortId).toBe("out-2");
  // El ida y vuelta es el contrato: la tarea 3 saca de aquí con qué canal cruzar powerPerChannelW.
  expect(portChannelIndex(ampPortId)).toBe(2);
  expect(portChannelIndex(inputPortId(7))).toBe(7);
  expect(portChannelIndex(NAMED_PORT_IDS.speakerLink)).toBeNull();
});
