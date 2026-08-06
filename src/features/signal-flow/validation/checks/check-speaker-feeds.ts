// src/features/signal-flow/validation/checks/check-speaker-feeds.ts — ¿cada caja recibe lo suyo?
//
// Es el check que justifica todo el modelo de dominios. Una caja activa necesita LÍNEA (y la trae
// una consola, un procesador o el enlace de otra activa); una pasiva necesita POTENCIA, que solo
// sale de un amplificador con etapa. Si no se puede decir de dónde salen los vatios, no hay
// electricalPowerW que poner en el SimulationRequest: es error, no aviso.

import {
  edgesOutOfPort,
  type GraphIndex,
  nodeOf,
  nodesOfKind,
} from "@/features/signal-flow/model/graph-index";
import type { ResolvedNode } from "@/features/signal-flow/model/resolved-flow";
import {
  minSupportedLoadOhm,
  powerAtLoadW,
} from "@/features/signal-flow/resolution/amplifier-load";
import {
  resolveSpeakerFeed,
  type SpeakerFeed,
} from "@/features/signal-flow/resolution/resolve-speaker-feed";
import { channelPowerShare } from "@/features/signal-flow/resolution/speaker-power";
import { NAMED_PORT_IDS } from "@/features/signal-flow/schemas/port-ids";
import {
  type FlowIssue,
  flowIssue,
} from "@/features/signal-flow/validation/issue-codes";

type SpeakerNode = Extract<ResolvedNode, { kind: "speaker" }>;

export function checkSpeakerFeeds(index: GraphIndex): FlowIssue[] {
  return nodesOfKind(index, "speaker").flatMap((speaker) => [
    ...checkFeed(index, speaker),
    ...checkReachesSimulation(index, speaker),
  ]);
}

function checkFeed(index: GraphIndex, speaker: SpeakerNode): FlowIssue[] {
  if (!speaker.spec) return [];

  const feed = resolveSpeakerFeed(index, speaker.id);
  if (feed.kind === "unfed" || feed.kind === "unknown") {
    return [unfedIssue(speaker)];
  }
  return feed.kind === "passive" ? checkAmpLoad(index, speaker, feed) : [];
}

function unfedIssue(speaker: SpeakerNode): FlowIssue {
  return speaker.spec?.electrical.activePowered
    ? flowIssue(
        "SPEAKER_WITHOUT_SIGNAL",
        "Caja activa sin señal de línea: conéctala a una consola, un procesador o el enlace de otra caja.",
        { nodeId: speaker.id },
      )
    : flowIssue(
        "SPEAKER_WITHOUT_POWER",
        "Caja pasiva sin amplificador aguas arriba: no recibe vatios y no sonaría.",
        { nodeId: speaker.id },
      );
}

function checkAmpLoad(
  index: GraphIndex,
  speaker: SpeakerNode,
  feed: Extract<SpeakerFeed, { kind: "passive" }>,
): FlowIssue[] {
  const amp = nodeOf(index, feed.ampNodeId);
  if (amp?.kind !== "pa" || !amp.spec || amp.spec.kind === "processor")
    return [];
  if (feed.loadImpedanceOhm === null) return []; // otra caja del canal ya está reportada

  const target = { nodeId: speaker.id };
  const load = powerAtLoadW(amp.spec, feed.loadImpedanceOhm);
  if (!load) {
    const minimum = minSupportedLoadOhm(amp.spec);
    return [
      flowIssue(
        "AMP_LOAD_UNSUPPORTED",
        `${feed.parallelSpeakerIds.length} cajas dejan el canal en ${feed.loadImpedanceOhm} Ω y el amplificador declara ${minimum} Ω como mínimo.`,
        target,
      ),
    ];
  }

  const issues: FlowIssue[] = [];
  if (!load.exact) {
    issues.push(
      flowIssue(
        "AMP_LOAD_MISMATCH",
        `La carga del canal (${feed.loadImpedanceOhm} Ω) no está en el datasheet: se tomará la de ${load.ohm} Ω.`,
        target,
      ),
    );
  }
  // El reparto sale de channelPowerShare y no de "watts entre N cajas": con impedancias mezcladas
  // no es el mismo número, y esa es justo la cifra que acabará en electricalPowerW.
  const share = channelPowerShare(index, speaker.id, feed.parallelSpeakerIds);
  const mismatch =
    share === null ? null : powerMismatch(speaker, load.watts * share);
  if (mismatch) issues.push(flowIssue("AMP_POWER_MISMATCH", mismatch, target));
  return issues;
}

// Práctica estándar de refuerzo sonoro: la etapa se dimensiona entre 1.5 y 2 veces la potencia
// continua de la caja, para tener headroom de picos sin recortar. Fuera de la horquilla de abajo
// no es un error de grafo —el sistema suena— pero sí un montaje que conviene mirar: por debajo se
// clipea (y el clipping quema agudos), por encima se supera la excursión del cono.
function powerMismatch(
  speaker: SpeakerNode,
  perSpeakerW: number,
): string | null {
  const continuousW = speaker.spec?.power.continuousW;
  if (!continuousW) return null;

  const ratio = perSpeakerW / continuousW;

  if (ratio < 0.5) {
    return `El amplificador entrega ~${Math.round(perSpeakerW)} W a una caja de ${continuousW} W continuos: quedará subpotenciada.`;
  }
  if (ratio > 2.5) {
    return `El amplificador entrega ~${Math.round(perSpeakerW)} W a una caja de ${continuousW} W continuos: riesgo de daño.`;
  }
  return null;
}

function checkReachesSimulation(
  index: GraphIndex,
  speaker: SpeakerNode,
): FlowIssue[] {
  const toSimulation = edgesOutOfPort(
    index,
    speaker.id,
    NAMED_PORT_IDS.speakerToSimulation,
  );
  return toSimulation.length > 0
    ? []
    : [
        flowIssue(
          "SPEAKER_NOT_SIMULATED",
          "Esta caja no llega a la simulación: está en el sistema pero no sonará en el recinto.",
          { nodeId: speaker.id },
        ),
      ];
}
