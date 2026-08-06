// src/features/signal-flow/__tests__/can-connect.test.ts — la matriz de conexiones, caso por caso.
// Es el test que fija la decisión de Fase 2: qué cadenas reales se admiten (pa→pa, procesador→caja
// activa, encadenado de cajas) y cuáles se prohíben por física, que la lista lineal del doc no
// distinguía. Si alguien relaja un dominio, aquí es donde se entera.

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
  processorSpec,
  speakerSpec,
} from "@/features/signal-flow/__tests__/fixtures/specs";
import {
  buildGraphIndex,
  type GraphIndex,
} from "@/features/signal-flow/model/graph-index";
import { canConnect } from "@/features/signal-flow/rules/can-connect";
import {
  inputPortId,
  NAMED_PORT_IDS,
  outputPortId,
} from "@/features/signal-flow/schemas/port-ids";
import type { FlowEdge } from "@/features/signal-flow/schemas/signal-flow";

const OUT_0 = outputPortId(0);
const IN_0 = inputPortId(0);
const {
  input,
  output,
  sourceAcoustic,
  sourceDirect,
  speakerLink,
  speakerToSimulation,
} = NAMED_PORT_IDS;

function rig(edges: FlowEdge[] = []): GraphIndex {
  return buildGraphIndex(
    flow(
      [
        sourceNode("src"),
        microphoneNode("mic"),
        consoleNode("con"),
        paNode("amp", amplifierSpec()),
        paNode("dbx", processorSpec()),
        paNode("dbx2", processorSpec()),
        speakerNode("passive", speakerSpec({ activePowered: false })),
        speakerNode("passive2", speakerSpec({ activePowered: false })),
        speakerNode("active", speakerSpec({ activePowered: true })),
        speakerNode("active2", speakerSpec({ activePowered: true })),
        simulationNode(),
      ],
      edges,
    ),
  );
}

function attempt(
  index: GraphIndex,
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
) {
  return canConnect(index, { source, sourceHandle, target, targetHandle });
}

describe("canConnect · cadenas admitidas", () => {
  const allowed: [string, string, string, string, string][] = [
    ["fuente al aire → micrófono", "src", sourceAcoustic, "mic", input],
    ["fuente por línea (DI) → consola", "src", sourceDirect, "con", IN_0],
    ["micrófono → consola", "mic", output, "con", IN_0],
    ["consola → amplificador", "con", OUT_0, "amp", IN_0],
    ["consola → procesador", "con", OUT_0, "dbx", IN_0],
    ["consola → caja activa", "con", OUT_0, "active", input],
    [
      "procesador → caja activa (dbx que alimenta las cajas)",
      "dbx",
      OUT_0,
      "active",
      input,
    ],
    ["procesador → amplificador (pa→pa)", "dbx", OUT_0, "amp", IN_0],
    ["amplificador → caja pasiva", "amp", OUT_0, "passive", input],
    [
      "caja pasiva → caja pasiva (enlace en paralelo)",
      "passive",
      speakerLink,
      "passive2",
      input,
    ],
    [
      "caja activa → caja activa (thru del sub)",
      "active",
      speakerLink,
      "active2",
      input,
    ],
    ["parlante → simulación", "passive", speakerToSimulation, "sim", input],
  ];

  it.each(allowed)(
    "admite %s",
    (_name, source, sourceHandle, target, targetHandle) => {
      expect(
        attempt(rig(), source, sourceHandle, target, targetHandle).ok,
      ).toBe(true);
    },
  );

  it("la simulación admite varios parlantes en su única entrada", () => {
    const index = rig([edge("passive", speakerToSimulation, "sim", input)]);

    expect(attempt(index, "active", speakerToSimulation, "sim", input).ok).toBe(
      true,
    );
  });
});

describe("canConnect · lo que la física prohíbe", () => {
  it("rechaza amplificador → caja activa: la potencia sobre una entrada de línea la destruye", () => {
    const check = attempt(rig(), "amp", OUT_0, "active", input);

    expect(check.ok).toBe(false);
    if (check.ok) return;
    expect(check.rejection.code).toBe("DOMAIN_MISMATCH");
    expect(check.message).toContain("destruye");
  });

  it("rechaza consola → caja pasiva: una salida de línea no entrega vatios", () => {
    const check = attempt(rig(), "con", OUT_0, "passive", input);

    expect(check.ok).toBe(false);
    if (check.ok) return;
    expect(check.rejection.code).toBe("DOMAIN_MISMATCH");
    expect(check.message).toContain("amplificador");
  });

  it("rechaza fuente al aire → consola: lo acústico solo entra por un micrófono", () => {
    const check = attempt(rig(), "src", sourceAcoustic, "con", IN_0);

    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.rejection.code).toBe("DOMAIN_MISMATCH");
  });

  it("rechaza procesador → caja pasiva: no tiene etapa de potencia", () => {
    const check = attempt(rig(), "dbx", OUT_0, "passive", input);

    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.rejection.code).toBe("DOMAIN_MISMATCH");
  });
});

describe("canConnect · reglas estructurales", () => {
  it("rechaza un nodo consigo mismo", () => {
    const check = attempt(rig(), "con", OUT_0, "con", IN_0);

    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.rejection.code).toBe("SELF_CONNECTION");
  });

  it("rechaza entrada → entrada", () => {
    const check = attempt(rig(), "con", IN_0, "amp", IN_0);

    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.rejection.code).toBe("DIRECTION_MISMATCH");
  });

  it("rechaza un canal que el datasheet no tiene", () => {
    const check = attempt(rig(), "con", outputPortId(99), "amp", IN_0);

    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.rejection.code).toBe("PORT_NOT_FOUND");
  });

  it("rechaza una segunda señal sobre una entrada ya ocupada", () => {
    const index = rig([edge("con", OUT_0, "amp", IN_0)]);

    const check = attempt(index, "dbx", OUT_0, "amp", IN_0);

    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.rejection.code).toBe("PORT_BUSY");
  });

  it("rechaza repetir una conexión que ya existe", () => {
    const index = rig([edge("con", OUT_0, "amp", IN_0)]);

    const check = attempt(index, "con", OUT_0, "amp", IN_0);

    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.rejection.code).toBe("DUPLICATE_EDGE");
  });

  it("rechaza cerrar un lazo entre dos procesadores", () => {
    const index = rig([edge("dbx", OUT_0, "dbx2", IN_0)]);

    const check = attempt(index, "dbx2", OUT_0, "dbx", IN_0);

    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.rejection.code).toBe("WOULD_CREATE_CYCLE");
  });

  it("admite el fan-out de una salida: un canal alimenta dos cajas en paralelo", () => {
    const index = rig([edge("amp", OUT_0, "passive", input)]);

    expect(attempt(index, "amp", OUT_0, "passive2", input).ok).toBe(true);
  });
});
