// src/features/signal-flow/model/node-ports.ts — puertos de un nodo, derivados de su datasheet.
// Aquí es donde el catálogo decide la topología: pa.kind elige si la salida es línea o potencia y
// speaker.electrical.activePowered elige qué acepta la entrada de la caja. Todo lo que la Sección
// 5.1 llama "N según spec" nace en este archivo.
//
// Un nodo sin spec resuelto devuelve cero puertos, no puertos por defecto: inventar dos canales
// para una consola que no se pudo leer haría que aristas colgantes parecieran válidas.

import type { ResolvedNode } from "@/features/signal-flow/model/resolved-flow";
import type { SignalDomain } from "@/features/signal-flow/model/signal-domain";
import {
  inputPortId,
  NAMED_PORT_IDS,
  outputPortId,
} from "@/features/signal-flow/schemas/port-ids";

export type FlowPort = {
  id: string;
  direction: "in" | "out";
  domain: SignalDomain;
  label: string;
  /** Las entradas físicas admiten UNA arista: dos salidas sobre una entrada no existe en un rack. */
  maxConnections: number;
};

/** Las salidas se reparten (un bus alimenta varios PA; un canal de potencia, dos cajas en paralelo). */
const FAN_OUT = Number.POSITIVE_INFINITY;

export function portsOf(node: ResolvedNode): FlowPort[] {
  switch (node.kind) {
    case "source":
      return sourcePorts();
    case "microphone":
      return microphonePorts();
    case "console":
      return node.spec
        ? channelPorts(
            node.spec.io.inputChannels,
            "line",
            node.spec.io.outputBuses,
            "line",
            "Bus",
          )
        : [];
    case "pa":
      return paPorts(node);
    case "speaker":
      return speakerPorts(node);
    case "simulation":
      return simulationPorts();
  }
}

export function findPort(node: ResolvedNode, portId: string): FlowPort | null {
  return portsOf(node).find((port) => port.id === portId) ?? null;
}

// La fuente no sale del catálogo en cuanto a puertos: siempre radia al aire (para que la capte un
// micrófono) y siempre ofrece una salida de línea (DI o pastilla). Que la línea sea razonable lo
// dice spec.amplified, pero es un aviso del validador, no una prohibición: un cajón con pastilla
// o una batería con trigger existen, y el doc admite source→console sin condiciones.
function sourcePorts(): FlowPort[] {
  return [
    portOf(
      NAMED_PORT_IDS.sourceAcoustic,
      "out",
      "acoustic",
      "Al aire",
      FAN_OUT,
    ),
    portOf(NAMED_PORT_IDS.sourceDirect, "out", "line", "Línea / DI", FAN_OUT),
  ];
}

function microphonePorts(): FlowPort[] {
  return [
    portOf(NAMED_PORT_IDS.input, "in", "acoustic", "Cápsula", 1),
    portOf(NAMED_PORT_IDS.output, "out", "line", "Salida", FAN_OUT),
  ];
}

// El procesador (dbx DriveRack, Behringer DCX) saca LÍNEA: por eso puede alimentar un amplificador
// —la cadena pa→pa que el doc dejaba pendiente— o directamente cajas activas. El amplificador saca
// POTENCIA, que solo admite una caja pasiva.
function paPorts(node: Extract<ResolvedNode, { kind: "pa" }>): FlowPort[] {
  if (!node.spec) return [];

  const outputDomain: SignalDomain =
    node.spec.kind === "processor" ? "line" : "speaker_level";

  return channelPorts(
    node.spec.io.inputChannels,
    "line",
    node.spec.io.outputChannels,
    outputDomain,
    "Canal",
  );
}

// La caja activa lleva el amplificador dentro: espera línea, y recibir potencia la destruye. La
// pasiva es al revés. El link es la salida de enlace real (thru del sub, paralelo de dos pasivas
// sobre un mismo canal) y arrastra el mismo dominio que la entrada, porque es un puente físico.
function speakerPorts(
  node: Extract<ResolvedNode, { kind: "speaker" }>,
): FlowPort[] {
  if (!node.spec) return [];

  const domain: SignalDomain = node.spec.electrical.activePowered
    ? "line"
    : "speaker_level";

  return [
    portOf(NAMED_PORT_IDS.input, "in", domain, "Entrada", 1),
    portOf(NAMED_PORT_IDS.speakerLink, "out", domain, "Enlace", FAN_OUT),
    portOf(
      NAMED_PORT_IDS.speakerToSimulation,
      "out",
      "simulation_feed",
      "Al recinto",
      FAN_OUT,
    ),
  ];
}

// Única entrada del grafo que admite N aristas: no es un conector, es el conjunto de parlantes que
// suenan en el recinto.
function simulationPorts(): FlowPort[] {
  return [
    portOf(NAMED_PORT_IDS.input, "in", "simulation_feed", "Parlantes", FAN_OUT),
  ];
}

function channelPorts(
  inputCount: number,
  inputDomain: SignalDomain,
  outputCount: number,
  outputDomain: SignalDomain,
  outputLabel: string,
): FlowPort[] {
  const inputs = Array.from({ length: inputCount }, (_, index) =>
    portOf(inputPortId(index), "in", inputDomain, `Entrada ${index + 1}`, 1),
  );
  const outputs = Array.from({ length: outputCount }, (_, index) =>
    portOf(
      outputPortId(index),
      "out",
      outputDomain,
      `${outputLabel} ${index + 1}`,
      FAN_OUT,
    ),
  );
  return [...inputs, ...outputs];
}

function portOf(
  id: string,
  direction: FlowPort["direction"],
  domain: SignalDomain,
  label: string,
  maxConnections: number,
): FlowPort {
  return { id, direction, domain, label, maxConnections };
}
