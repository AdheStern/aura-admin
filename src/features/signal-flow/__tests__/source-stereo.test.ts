// src/features/signal-flow/__tests__/source-stereo.test.ts — la fuente estéreo expone L y R.
// Lo importante que se fija aquí: el canal izquierdo REUSA el id `di` del modo mono, para que
// pasar de mono a estéreo no invalide el cable que ya estaba puesto.

import { describe, expect, it } from "vitest";
import {
  consoleNode,
  edge,
  flow,
  sourceNode,
} from "@/features/signal-flow/__tests__/fixtures/flow-builder";
import { sourceSpec } from "@/features/signal-flow/__tests__/fixtures/specs";
import { buildGraphIndex } from "@/features/signal-flow/model/graph-index";
import { portsOf } from "@/features/signal-flow/model/node-ports";
import { canConnect } from "@/features/signal-flow/rules/can-connect";
import { flowNodeDataSchema } from "@/features/signal-flow/schemas/node-data";
import {
  inputPortId,
  NAMED_PORT_IDS,
} from "@/features/signal-flow/schemas/port-ids";

const teclado = sourceSpec({ kind: "keys", name: "Sintetizador" });
const outIds = (node: Parameters<typeof portsOf>[0]) =>
  portsOf(node)
    .filter((port) => port.direction === "out")
    .map((port) => port.id);

describe("puertos de la fuente", () => {
  it("en mono ofrece el aire y una sola salida de línea", () => {
    expect(outIds(sourceNode("src", teclado, "mono"))).toEqual([
      NAMED_PORT_IDS.sourceAcoustic,
      NAMED_PORT_IDS.sourceDirect,
    ]);
  });

  it("en estéreo añade la derecha y conserva `di` como izquierda", () => {
    expect(outIds(sourceNode("src", teclado, "stereo"))).toEqual([
      NAMED_PORT_IDS.sourceAcoustic,
      NAMED_PORT_IDS.sourceDirect,
      NAMED_PORT_IDS.sourceDirectRight,
    ]);
  });

  it("las dos salidas de línea van a canales distintos de la consola", () => {
    const index = buildGraphIndex(
      flow(
        [sourceNode("src", teclado, "stereo"), consoleNode("con")],
        [edge("src", NAMED_PORT_IDS.sourceDirect, "con", inputPortId(0))],
      ),
    );

    const right = canConnect(index, {
      source: "src",
      sourceHandle: NAMED_PORT_IDS.sourceDirectRight,
      target: "con",
      targetHandle: inputPortId(1),
    });

    expect(right.ok).toBe(true);
  });

  it("pasar a mono deja el conector derecho sin existir, que es lo que el validador reporta", () => {
    const stereo = sourceNode("src", teclado, "stereo");
    const mono = sourceNode("src", teclado, "mono");

    expect(outIds(stereo)).toContain(NAMED_PORT_IDS.sourceDirectRight);
    expect(outIds(mono)).not.toContain(NAMED_PORT_IDS.sourceDirectRight);
  });
});

describe("compatibilidad del documento guardado", () => {
  it("una fuente guardada antes del estéreo se lee como mono", () => {
    const parsed = flowNodeDataSchema.parse({
      kind: "source",
      catalogItemId: "clx0000000000000000000000",
    });

    expect(parsed).toEqual({
      kind: "source",
      catalogItemId: "clx0000000000000000000000",
      outputMode: "mono",
    });
  });
});
