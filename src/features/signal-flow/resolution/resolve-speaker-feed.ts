// src/features/signal-flow/resolution/resolve-speaker-feed.ts — cómo llega la señal a un parlante.
//
// Es la costura con la tarea 3 ("resolución eléctrica del grafo"). Hoy la usa el validador para
// decidir si la potencia es RESOLUBLE; la tarea 3 usará el mismo resultado para calcular cuántos
// vatios recibe cada caja. Se escribe una vez: comprobar que hay potencia y calcularla son la
// misma travesía del grafo, y duplicarla garantizaría que un día discrepen.
//
// Física: varias cajas sobre un canal de potencia quedan en PARALELO, y la carga resultante
// (1/Z = Σ 1/Zi) baja al aumentar el número de cajas. Por eso AmplifierSpec.powerPerChannelW está
// indexado por impedancia y no es un escalar. Da igual que el paralelo se cablee abriendo el canal
// en dos (fan-out) o encadenando por el link de la primera caja: eléctricamente es lo mismo, y por
// eso esta función recorre ambos caminos.

import {
  edgesIntoPort,
  edgesOutOfPort,
  type GraphIndex,
  nodeOf,
} from "@/features/signal-flow/model/graph-index";
import type { ResolvedNode } from "@/features/signal-flow/model/resolved-flow";
import { NAMED_PORT_IDS } from "@/features/signal-flow/schemas/port-ids";
import type { FlowEdge } from "@/features/signal-flow/schemas/signal-flow";

export type SpeakerFeed =
  /** El datasheet del parlante no se pudo resolver: no se sabe si es activo o pasivo. */
  | { kind: "unknown" }
  /** Nada llega a su entrada, o la cadena aguas arriba no termina en potencia. */
  | { kind: "unfed" }
  /** Caja activa: lleva la etapa dentro, le basta con recibir línea. */
  | { kind: "active"; lineFeedNodeId: string }
  /** Caja pasiva: cuelga de un canal de potencia, quizá compartido con otras. */
  | {
      kind: "passive";
      ampNodeId: string;
      ampPortId: string;
      /** Todas las cajas del canal, incluida esta. Entre ellas se reparte la potencia. */
      parallelSpeakerIds: string[];
      /** null si alguna caja del canal no tiene spec: mejor sin cifra que con una inventada. */
      loadImpedanceOhm: number | null;
    };

export function resolveSpeakerFeed(
  index: GraphIndex,
  speakerId: string,
): SpeakerFeed {
  const speaker = nodeOf(index, speakerId);
  if (speaker?.kind !== "speaker" || !speaker.spec) return { kind: "unknown" };

  const incoming = edgesIntoPort(index, speakerId, NAMED_PORT_IDS.input);
  const feed = incoming[0];
  if (!feed) return { kind: "unfed" };

  if (speaker.spec.electrical.activePowered) {
    return { kind: "active", lineFeedNodeId: feed.source };
  }

  const amp = walkUpstreamToAmp(index, speakerId);
  if (!amp) return { kind: "unfed" };

  const parallelSpeakerIds = collectSpeakersOnPort(
    index,
    amp.ampNodeId,
    amp.ampPortId,
  );
  return {
    kind: "passive",
    ...amp,
    parallelSpeakerIds,
    loadImpedanceOhm: parallelImpedanceOhm(index, parallelSpeakerIds),
  };
}

/** Sube por la entrada de la caja atravesando los enlaces de otras cajas hasta dar con el ampli. */
function walkUpstreamToAmp(
  index: GraphIndex,
  speakerId: string,
): { ampNodeId: string; ampPortId: string } | null {
  const visited = new Set<string>();
  let currentId: string | null = speakerId;

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId);
    // Anotado a mano: currentId sale de este mismo edge y TS no rompe la circularidad solo.
    const edge: FlowEdge | undefined = edgesIntoPort(
      index,
      currentId,
      NAMED_PORT_IDS.input,
    )[0];
    if (!edge) return null;

    const upstream = nodeOf(index, edge.source);
    if (upstream?.kind === "pa") {
      return isPoweredAmp(upstream)
        ? { ampNodeId: edge.source, ampPortId: edge.sourceHandle }
        : null;
    }
    // Solo se sigue por el enlace de otra caja; cualquier otro origen no entrega potencia.
    currentId =
      upstream?.kind === "speaker" &&
      edge.sourceHandle === NAMED_PORT_IDS.speakerLink
        ? upstream.id
        : null;
  }
  return null;
}

/** Baja desde el canal del ampli recogiendo el fan-out y las cadenas de enlace. */
function collectSpeakersOnPort(
  index: GraphIndex,
  nodeId: string,
  portId: string,
): string[] {
  const found: string[] = [];
  const pending = edgesOutOfPort(index, nodeId, portId).map(
    (edge) => edge.target,
  );
  const visited = new Set<string>();

  while (pending.length > 0) {
    const currentId = pending.pop() as string;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    if (nodeOf(index, currentId)?.kind !== "speaker") continue;
    found.push(currentId);
    for (const edge of edgesOutOfPort(
      index,
      currentId,
      NAMED_PORT_IDS.speakerLink,
    )) {
      pending.push(edge.target);
    }
  }
  return found;
}

function parallelImpedanceOhm(
  index: GraphIndex,
  speakerIds: readonly string[],
): number | null {
  let admittance = 0;
  for (const id of speakerIds) {
    const node = nodeOf(index, id);
    if (node?.kind !== "speaker" || !node.spec) return null;
    admittance += 1 / node.spec.power.impedanceOhm;
  }
  if (admittance === 0) return null;

  // Dos decimales: 3 cajas de 8 Ω dan 2.6667 Ω y la cifra cruda ensucia el aviso sin aportar nada.
  return Math.round((1 / admittance) * 100) / 100;
}

function isPoweredAmp(node: Extract<ResolvedNode, { kind: "pa" }>): boolean {
  return node.spec !== null && node.spec.kind !== "processor";
}
