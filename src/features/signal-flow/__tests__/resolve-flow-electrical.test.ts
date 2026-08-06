// src/features/signal-flow/__tests__/resolve-flow-electrical.test.ts — el grafo convertido en las
// `sources` del SimulationRequest. Lo que se fija aquí es la frontera: qué cajas entran, qué campos
// salen resueltos del flujo y cuáles quedan para el editor 3D.

import { describe, expect, it } from "vitest";
import {
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
  sourceSpec,
  speakerSpec,
} from "@/features/signal-flow/__tests__/fixtures/specs";
import type { ResolvedFlow } from "@/features/signal-flow/model/resolved-flow";
import { resolveFlowElectrical } from "@/features/signal-flow/resolution/resolve-flow-electrical";
import {
  inputPortId,
  NAMED_PORT_IDS,
  outputPortId,
} from "@/features/signal-flow/schemas/port-ids";
import { validateSignalFlow } from "@/features/signal-flow/validation/validate-signal-flow";

const OUT_0 = outputPortId(0);
const OUT_1 = outputPortId(1);
const IN_0 = inputPortId(0);
const { input, sourceDirect, speakerToSimulation } = NAMED_PORT_IDS;

const teclado = () =>
  sourceNode(
    "src",
    sourceSpec({ kind: "keys", name: "Teclado", amplified: true }),
  );
const pasiva = (id: string) =>
  speakerNode(id, speakerSpec({ activePowered: false, continuousW: 400 }));

/** El camino dorado de la Sección 11: fuente → consola → PA → 2 cajas → simulación. */
function goldenRig(): ResolvedFlow {
  return flow(
    [
      teclado(),
      consoleNode("con"),
      paNode("amp", amplifierSpec({ "8": 300, "4": 525 })),
      pasiva("spk1"),
      pasiva("spk2"),
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

describe("resolveFlowElectrical", () => {
  it("resuelve el camino dorado a dos fuentes con potencia y programa", () => {
    const result = resolveFlowElectrical(goldenRig());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sources).toHaveLength(2);

    const [first] = result.sources;
    // Un canal por caja: cada una carga su canal con 8 Ω y se lleva los 300 W enteros.
    expect(first?.electricalPowerW).toBe(300);
    expect(first?.programSpectrum).toBe("keys");
    expect(first?.catalogRef).toBe("CatalogSpeaker:cat-spk1");
    expect(first?.levelDb).toBe(0);
    expect(first?.polarityInverted).toBe(false);
    expect(first?.delayMs).toBe(0);
    expect(first?.spec.power.impedanceOhm).toBe(8);
  });

  it("lo que resuelve es exactamente lo que el validador deja pasar", () => {
    const rig = goldenRig();

    expect(validateSignalFlow(rig).isComplete).toBe(true);
    expect(resolveFlowElectrical(rig).ok).toBe(true);
  });

  it("arrastra los ajustes de escena de cada caja tal cual", () => {
    const base = goldenRig();
    const tuned = flow(
      base.nodes.map((node) =>
        node.id === "spk2" && node.kind === "speaker"
          ? {
              ...node,
              data: {
                ...node.data,
                levelDb: -3,
                polarityInverted: true,
                delayMs: 12,
              },
            }
          : node,
      ),
      base.edges,
    );

    const result = resolveFlowElectrical(tuned);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const spk2 = result.sources.find((source) => source.nodeId === "spk2");
    expect(spk2).toMatchObject({
      levelDb: -3,
      polarityInverted: true,
      delayMs: 12,
    });
  });

  it("deja fuera la caja que no llega a la simulación: está en el rack, no en la sala", () => {
    const base = goldenRig();
    const rig = flow(
      [...base.nodes, pasiva("spk3")],
      [...base.edges, edge("amp", outputPortId(2), "spk3", input)],
    );

    const result = resolveFlowElectrical(rig);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sources.map((source) => source.nodeId)).toEqual([
      "spk1",
      "spk2",
    ]);
  });

  it("dos cajas en el mismo canal se reparten su potencia", () => {
    const base = goldenRig();
    const rig = flow(
      base.nodes,
      base.edges.map((current) =>
        current.id === edge("amp", OUT_1, "spk2", input).id
          ? edge("amp", OUT_0, "spk2", input)
          : current,
      ),
    );

    const result = resolveFlowElectrical(rig);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // 2 × 8 Ω = 4 Ω → 525 W al canal → 262.5 W a cada caja.
    expect(result.sources.map((source) => source.electricalPowerW)).toEqual([
      262.5, 262.5,
    ]);
  });

  it("es todo o nada: una caja sin alimentar impide compilar el payload entero", () => {
    const base = goldenRig();
    const rig = flow(
      [...base.nodes, pasiva("huerfana")],
      [...base.edges, edge("huerfana", speakerToSimulation, "sim", input)],
    );

    const result = resolveFlowElectrical(rig);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.unresolved).toEqual([
      { nodeId: "huerfana", reason: "SPEAKER_WITHOUT_POWER" },
    ]);
  });

  it("una caja sin fuente aguas arriba no tiene programa que declarar", () => {
    const base = goldenRig();
    const rig = flow(
      [...base.nodes, paNode("amp2", amplifierSpec()), pasiva("muda")],
      [
        ...base.edges,
        edge("amp2", OUT_0, "muda", input),
        edge("muda", speakerToSimulation, "sim", input),
      ],
    );

    const result = resolveFlowElectrical(rig);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.unresolved).toEqual([
      { nodeId: "muda", reason: "SPEAKER_WITHOUT_PROGRAM" },
    ]);
  });

  it("un sistema de cajas activas colgadas del procesador también resuelve", () => {
    const rig = flow(
      [
        teclado(),
        consoleNode("con"),
        speakerNode(
          "activa",
          speakerSpec({ activePowered: true, continuousW: 800 }),
        ),
        simulationNode(),
      ],
      [
        edge("src", sourceDirect, "con", IN_0),
        edge("con", OUT_0, "activa", input),
        edge("activa", speakerToSimulation, "sim", input),
      ],
    );

    const result = resolveFlowElectrical(rig);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sources[0]?.electricalPowerW).toBe(800);
  });
});
