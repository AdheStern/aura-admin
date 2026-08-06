// src/features/signal-flow/__tests__/validate-signal-flow.test.ts — el veredicto de "sistema
// completo". Las dos primeras pruebas son las que importan: los dos montajes reales tienen que dar
// cero errores Y cero avisos, porque un validador que regaña sobre un sistema correcto se ignora.

import { describe, expect, it } from "vitest";
import {
  brokenNode,
  consoleNode,
  edge,
  flow,
  paNode,
  simulationNode,
  sourceNode,
  speakerNode,
} from "@/features/signal-flow/__tests__/fixtures/flow-builder";
import {
  amplifierSpec,
  processorSpec,
  sourceSpec,
  speakerSpec,
} from "@/features/signal-flow/__tests__/fixtures/specs";
import type { ResolvedFlow } from "@/features/signal-flow/model/resolved-flow";
import {
  inputPortId,
  NAMED_PORT_IDS,
  outputPortId,
} from "@/features/signal-flow/schemas/port-ids";
import { nextSceneStatus } from "@/features/signal-flow/validation/scene-status";
import { validateSignalFlow } from "@/features/signal-flow/validation/validate-signal-flow";

const OUT_0 = outputPortId(0);
const OUT_1 = outputPortId(1);
const IN_0 = inputPortId(0);
const { input, sourceDirect, speakerLink, speakerToSimulation } =
  NAMED_PORT_IDS;

/** Teclado: fuente amplificada, así que entra por línea sin micrófono y sin avisos. */
const keys = () =>
  sourceNode(
    "src",
    sourceSpec({ kind: "keys", name: "Teclado", amplified: true }),
  );
const passive = (id: string, impedanceOhm = 8) =>
  speakerNode(id, speakerSpec({ activePowered: false, impedanceOhm }));
const active = (id: string) =>
  speakerNode(id, speakerSpec({ activePowered: true }));

function codes(issues: { code: string }[]): string[] {
  return issues.map((issue) => issue.code);
}

// El camino dorado del E2E de la Sección 11: fuente → consola → PA → 2 parlantes → simulación.
function passiveRig(): ResolvedFlow {
  return flow(
    [
      keys(),
      consoleNode("con"),
      paNode("amp", amplifierSpec()),
      passive("spk1"),
      passive("spk2"),
      simulationNode(),
    ],
    [
      edge("src", sourceDirect, "con", IN_0),
      edge("con", OUT_0, "amp", IN_0),
      edge("amp", OUT_0, "spk1", input),
      edge("amp", OUT_1, "spk2", input),
      edge("spk1", speakerToSimulation, "sim", input),
      edge("spk2", speakerToSimulation, "sim", input),
    ],
  );
}

// El montaje que motivó revisar las reglas: las cajas cuelgan directamente del dbx, sin ampli.
function processorRig(): ResolvedFlow {
  return flow(
    [
      keys(),
      consoleNode("con"),
      paNode("dbx", processorSpec()),
      active("spk1"),
      active("spk2"),
      simulationNode(),
    ],
    [
      edge("src", sourceDirect, "con", IN_0),
      edge("con", OUT_0, "dbx", IN_0),
      edge("dbx", OUT_0, "spk1", input),
      edge("dbx", OUT_1, "spk2", input),
      edge("spk1", speakerToSimulation, "sim", input),
      edge("spk2", speakerToSimulation, "sim", input),
    ],
  );
}

describe("validateSignalFlow · sistemas completos", () => {
  it("acepta el sistema clásico: consola → amplificador → 2 cajas pasivas", () => {
    const result = validateSignalFlow(passiveRig());

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.isComplete).toBe(true);
  });

  it("acepta cajas activas colgadas directamente del procesador, sin amplificador", () => {
    const result = validateSignalFlow(processorRig());

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.isComplete).toBe(true);
  });

  it("acepta el procesador delante del amplificador (pa→pa)", () => {
    const rig = flow(
      [
        keys(),
        consoleNode("con"),
        paNode("dbx", processorSpec()),
        paNode("amp", amplifierSpec()),
        passive("spk1"),
        simulationNode(),
      ],
      [
        edge("src", sourceDirect, "con", IN_0),
        edge("con", OUT_0, "dbx", IN_0),
        edge("dbx", OUT_0, "amp", IN_0),
        edge("amp", OUT_0, "spk1", input),
        edge("spk1", speakerToSimulation, "sim", input),
      ],
    );

    expect(validateSignalFlow(rig).isComplete).toBe(true);
  });
});

describe("validateSignalFlow · alimentación de las cajas", () => {
  it("una caja pasiva sin amplificador aguas arriba es error", () => {
    const rig = flow(
      [keys(), consoleNode("con"), passive("spk1"), simulationNode()],
      [
        edge("src", sourceDirect, "con", IN_0),
        edge("spk1", speakerToSimulation, "sim", input),
      ],
    );

    expect(codes(validateSignalFlow(rig).errors)).toContain(
      "SPEAKER_WITHOUT_POWER",
    );
  });

  it("una caja activa sin señal de línea es error", () => {
    const rig = flow(
      [keys(), active("spk1"), simulationNode()],
      [edge("spk1", speakerToSimulation, "sim", input)],
    );

    expect(codes(validateSignalFlow(rig).errors)).toContain(
      "SPEAKER_WITHOUT_SIGNAL",
    );
  });

  it("cuatro cajas de 8 Ω en un canal dejan 2 Ω y el amplificador declara 4 Ω como mínimo", () => {
    const rig = flow(
      [
        keys(),
        consoleNode("con"),
        paNode("amp", amplifierSpec({ "8": 400, "4": 600 })),
        passive("a"),
        passive("b"),
        passive("c"),
        passive("d"),
        simulationNode(),
      ],
      [
        edge("src", sourceDirect, "con", IN_0),
        edge("con", OUT_0, "amp", IN_0),
        edge("amp", OUT_0, "a", input),
        edge("amp", OUT_0, "b", input),
        edge("a", speakerLink, "c", input),
        edge("b", speakerLink, "d", input),
        edge("a", speakerToSimulation, "sim", input),
      ],
    );

    const result = validateSignalFlow(rig);

    expect(codes(result.errors)).toContain("AMP_LOAD_UNSUPPORTED");
    expect(result.isComplete).toBe(false);
  });

  it("una carga que no está tabulada avisa de la carga que se usará en su lugar", () => {
    const rig = flow(
      [
        keys(),
        consoleNode("con"),
        paNode("amp", amplifierSpec({ "8": 400, "4": 600, "2": 800 })),
        passive("a"),
        passive("b"),
        passive("c"),
        simulationNode(),
      ],
      [
        edge("src", sourceDirect, "con", IN_0),
        edge("con", OUT_0, "amp", IN_0),
        edge("amp", OUT_0, "a", input),
        edge("amp", OUT_0, "b", input),
        edge("b", speakerLink, "c", input),
        edge("a", speakerToSimulation, "sim", input),
      ],
    );

    const result = validateSignalFlow(rig);

    expect(codes(result.warnings)).toContain("AMP_LOAD_MISMATCH");
    expect(result.isComplete).toBe(true);
  });

  it("avisa cuando el amplificador queda corto para la caja", () => {
    const rig = flow(
      [
        keys(),
        consoleNode("con"),
        paNode("amp", amplifierSpec({ "8": 100 })),
        passive("spk1"),
        simulationNode(),
      ],
      [
        edge("src", sourceDirect, "con", IN_0),
        edge("con", OUT_0, "amp", IN_0),
        edge("amp", OUT_0, "spk1", input),
        edge("spk1", speakerToSimulation, "sim", input),
      ],
    );

    const result = validateSignalFlow(rig);

    expect(codes(result.warnings)).toContain("AMP_POWER_MISMATCH");
    expect(result.isComplete).toBe(true);
  });

  it("una caja bien alimentada que no llega a la simulación es solo aviso", () => {
    const base = passiveRig();
    const rig = flow(
      [...base.nodes, passive("spk3")],
      [...base.edges, edge("amp", OUT_1, "spk3", input)],
    );

    const result = validateSignalFlow(rig);

    expect(codes(result.warnings)).toContain("SPEAKER_NOT_SIMULATED");
    expect(result.isComplete).toBe(true);
  });
});

describe("validateSignalFlow · estructura y catálogo", () => {
  it("sin nodo de simulación no hay sistema", () => {
    const rig = flow(
      [keys(), consoleNode("con")],
      [edge("src", sourceDirect, "con", IN_0)],
    );

    expect(codes(validateSignalFlow(rig).errors)).toContain(
      "SIMULATION_NODE_MISSING",
    );
  });

  it("con parlantes pero ninguno conectado a la simulación tampoco", () => {
    const base = passiveRig();
    const rig = flow(base.nodes, base.edges.slice(0, 4));

    expect(codes(validateSignalFlow(rig).errors)).toContain(
      "NO_SPEAKER_IN_SIMULATION",
    );
  });

  it("un equipo borrado del catálogo bloquea la escena", () => {
    const rig = flow(
      [
        keys(),
        brokenNode("console", "con", "item_missing"),
        simulationNode(),
        passive("spk1"),
      ],
      [edge("spk1", speakerToSimulation, "sim", input)],
    );

    expect(codes(validateSignalFlow(rig).errors)).toContain(
      "CATALOG_ITEM_MISSING",
    );
  });

  it("un nodo sin equipo elegido se distingue de uno borrado", () => {
    const rig = flow(
      [brokenNode("speaker", "spk1", "not_selected"), simulationNode()],
      [edge("spk1", speakerToSimulation, "sim", input)],
    );

    expect(codes(validateSignalFlow(rig).errors)).toContain(
      "NODE_WITHOUT_CATALOG_ITEM",
    );
  });

  it("una arista a un canal que el datasheet ya no tiene es error", () => {
    const base = passiveRig();
    const rig = flow(base.nodes, [
      ...base.edges,
      edge("con", outputPortId(99), "amp", inputPortId(1)),
    ]);

    expect(codes(validateSignalFlow(rig).errors)).toContain(
      "PORT_OUT_OF_RANGE",
    );
  });

  it("detecta un lazo guardado en el JSONB aunque el editor no lo permita dibujar", () => {
    const rig = flow(
      [
        paNode("dbx", processorSpec()),
        paNode("dbx2", processorSpec()),
        passive("spk1"),
        simulationNode(),
      ],
      [
        edge("dbx", OUT_0, "dbx2", IN_0),
        edge("dbx2", OUT_0, "dbx", IN_0),
        edge("spk1", speakerToSimulation, "sim", input),
      ],
    );

    expect(codes(validateSignalFlow(rig).errors)).toContain("CYCLE_DETECTED");
  });

  it("dos señales sobre la misma entrada es error", () => {
    const base = passiveRig();
    const rig = flow(base.nodes, [
      ...base.edges,
      edge("con", OUT_1, "amp", IN_0),
    ]);

    expect(codes(validateSignalFlow(rig).errors)).toContain(
      "PORT_OVERSUBSCRIBED",
    );
  });
});

describe("validateSignalFlow · programa", () => {
  it("un sistema sin ninguna fuente no tiene qué reproducir", () => {
    const base = passiveRig();
    const rig = flow(
      base.nodes.filter((node) => node.id !== "src"),
      base.edges.slice(1),
    );

    expect(codes(validateSignalFlow(rig).errors)).toContain(
      "SPEAKER_WITHOUT_PROGRAM",
    );
  });

  it("una caja alimentada por un ampli al que no llega ninguna fuente suena en silencio", () => {
    const base = passiveRig();
    const rig = flow(
      [...base.nodes, paNode("amp2", amplifierSpec()), passive("spk3")],
      [
        ...base.edges,
        edge("amp2", OUT_0, "spk3", input),
        edge("spk3", speakerToSimulation, "sim", input),
      ],
    );

    const withoutProgram = validateSignalFlow(rig).errors.filter(
      (issue) => issue.code === "SPEAKER_WITHOUT_PROGRAM",
    );

    expect(withoutProgram.map((issue) => issue.nodeId)).toEqual(["spk3"]);
  });

  it("una fuente no amplificada por línea avisa de que asume DI o pastilla", () => {
    const rig = flow(
      [sourceNode("src"), consoleNode("con"), simulationNode()],
      [edge("src", sourceDirect, "con", IN_0)],
    );

    expect(codes(validateSignalFlow(rig).warnings)).toContain(
      "UNAMPLIFIED_SOURCE_DIRECT_LINE",
    );
  });
});

describe("nextSceneStatus", () => {
  it("un grafo completo saca la escena de DRAFT", () => {
    expect(nextSceneStatus("DRAFT", true)).toBe("FLOW_READY");
  });

  it("romper el grafo devuelve a DRAFT desde cualquier estado posterior", () => {
    expect(nextSceneStatus("FLOW_READY", false)).toBe("DRAFT");
    expect(nextSceneStatus("ROOM_READY", false)).toBe("DRAFT");
    expect(nextSceneStatus("SIMULATED", false)).toBe("DRAFT");
  });

  it("un grafo válido no hace retroceder una escena ya avanzada", () => {
    expect(nextSceneStatus("ROOM_READY", true)).toBe("ROOM_READY");
    expect(nextSceneStatus("SIMULATED", true)).toBe("SIMULATED");
  });
});
