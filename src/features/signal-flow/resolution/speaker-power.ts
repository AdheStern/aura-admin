// src/features/signal-flow/resolution/speaker-power.ts — los vatios que recibe cada caja.
//
// Cierra la costura que la tarea 1 dejó abierta: resolveSpeakerFeed dice DE DÓNDE sale la potencia,
// esto dice CUÁNTA. Es el electricalPowerW del SimulationRequest, que el motor cruza con la
// sensibilidad para el campo directo: SPL(1 m) = dbSpl1w1m + 10·log₁₀(P).
//
// Física del reparto: las cajas de un canal quedan en PARALELO, comparten tensión y por tanto la
// potencia se reparte en proporción INVERSA a la impedancia (P_i = V²/Z_i). Como fracción:
//     P_i / P_total = (1/Z_i) / Σ(1/Z_j)
// Con cajas iguales eso se reduce a P_total/N —el caso habitual— pero con impedancias distintas no:
// una de 4 Ω junto a una de 8 Ω se lleva el doble de potencia. El reparto se calcula desde las
// admitancias crudas y NO desde feed.loadImpedanceOhm, que viene redondeado a dos decimales: con
// tres cajas de 8 Ω ese redondeo haría que las partes sumaran 100.1 % de la potencia del canal.
//
// La caja ACTIVA no depende del grafo: lleva su etapa dentro y su potencia es la continua de su
// propio datasheet. Combinada con la sensibilidad que el seed deriva de ahí
// (maxSPL − 10·log₁₀(continuaW)) reproduce exactamente el SPL máximo publicado, que es lo que la
// caja entrega a fondo; el atenuador de escena vive aparte, en levelDb.

import {
  type GraphIndex,
  nodeOf,
} from "@/features/signal-flow/model/graph-index";
import { powerAtLoadW } from "@/features/signal-flow/resolution/amplifier-load";
import {
  resolveSpeakerFeed,
  type SpeakerFeed,
} from "@/features/signal-flow/resolution/resolve-speaker-feed";
import type { FlowIssueCode } from "@/features/signal-flow/validation/issue-codes";

// Import de TIPO desde validation (se borra en compilación, no crea ciclo en runtime): cada motivo
// por el que la potencia no se puede resolver es, por construcción, un error que el validador ya
// reporta. Atarlos evita que un día digan cosas distintas del mismo grafo.
export type SpeakerPowerFailure = Extract<
  FlowIssueCode,
  | "SPEAKER_WITHOUT_POWER"
  | "SPEAKER_WITHOUT_SIGNAL"
  | "AMP_LOAD_UNSUPPORTED"
  | "NODE_WITHOUT_CATALOG_ITEM"
>;

/** De dónde salen los vatios. Lo consume el panel para explicar la cifra, no solo mostrarla. */
export type PowerOrigin =
  | { kind: "active_stage" }
  | {
      kind: "amplifier";
      ampNodeId: string;
      ampPortId: string;
      /** Vatios que el canal entrega al conjunto, antes de repartir entre las cajas. */
      channelWatts: number;
      loadImpedanceOhm: number;
      speakerCount: number;
    };

export type SpeakerPowerResolution =
  | { ok: true; watts: number; origin: PowerOrigin }
  | { ok: false; reason: SpeakerPowerFailure };

export function resolveSpeakerPower(
  index: GraphIndex,
  speakerId: string,
): SpeakerPowerResolution {
  const speaker = nodeOf(index, speakerId);
  if (speaker?.kind !== "speaker" || !speaker.spec) {
    // El validador distingue si falta elegir ítem, si se borró o si la versión no se lee; para la
    // potencia las tres son lo mismo: sin datasheet no hay impedancia con la que repartir.
    return { ok: false, reason: "NODE_WITHOUT_CATALOG_ITEM" };
  }

  const feed = resolveSpeakerFeed(index, speakerId);
  if (feed.kind === "unknown") {
    return { ok: false, reason: "NODE_WITHOUT_CATALOG_ITEM" };
  }
  if (feed.kind === "unfed") {
    return {
      ok: false,
      reason: speaker.spec.electrical.activePowered
        ? "SPEAKER_WITHOUT_SIGNAL"
        : "SPEAKER_WITHOUT_POWER",
    };
  }
  if (feed.kind === "active") {
    return {
      ok: true,
      watts: speaker.spec.power.continuousW,
      origin: { kind: "active_stage" },
    };
  }
  return fromAmplifier(index, speaker.id, feed);
}

/**
 * Fracción de la potencia del canal que se lleva esta caja: (1/Z_i) / Σ(1/Z_j).
 *
 * Exportada porque el aviso AMP_POWER_MISMATCH del validador necesita exactamente este reparto —
 * si lo recalculara "dividiendo entre N" volvería a haber dos físicas distintas en el proyecto.
 */
export function channelPowerShare(
  index: GraphIndex,
  speakerId: string,
  parallelSpeakerIds: readonly string[],
): number | null {
  const own = impedanceOhm(index, speakerId);
  if (own === null) return null;

  let totalAdmittance = 0;
  for (const id of parallelSpeakerIds) {
    const ohm = impedanceOhm(index, id);
    if (ohm === null) return null;
    totalAdmittance += 1 / ohm;
  }
  return totalAdmittance > 0 ? 1 / own / totalAdmittance : null;
}

function fromAmplifier(
  index: GraphIndex,
  speakerId: string,
  feed: Extract<SpeakerFeed, { kind: "passive" }>,
): SpeakerPowerResolution {
  const amp = nodeOf(index, feed.ampNodeId);
  // Cada guarda por separado y no un booleano combinado: TS solo estrecha amp.spec siguiendo la
  // cadena de comprobaciones, no a través de una variable intermedia.
  if (amp?.kind !== "pa" || !amp.spec || amp.spec.kind === "processor") {
    return { ok: false, reason: "SPEAKER_WITHOUT_POWER" };
  }
  if (feed.loadImpedanceOhm === null) {
    return { ok: false, reason: "NODE_WITHOUT_CATALOG_ITEM" };
  }

  const load = powerAtLoadW(amp.spec, feed.loadImpedanceOhm);
  if (!load) return { ok: false, reason: "AMP_LOAD_UNSUPPORTED" };

  const share = channelPowerShare(index, speakerId, feed.parallelSpeakerIds);
  if (share === null) return { ok: false, reason: "NODE_WITHOUT_CATALOG_ITEM" };

  return {
    ok: true,
    watts: load.watts * share,
    origin: {
      kind: "amplifier",
      ampNodeId: feed.ampNodeId,
      ampPortId: feed.ampPortId,
      channelWatts: load.watts,
      loadImpedanceOhm: feed.loadImpedanceOhm,
      speakerCount: feed.parallelSpeakerIds.length,
    },
  };
}

function impedanceOhm(index: GraphIndex, speakerId: string): number | null {
  const node = nodeOf(index, speakerId);
  return node?.kind === "speaker" && node.spec
    ? node.spec.power.impedanceOhm
    : null;
}

// Sin redondear a propósito: redondear aquí rompería que las partes sumen la potencia del canal
// (tres cajas de 258.333 W redondeadas dan 774.9 y no 775), y esa inconsistencia viajaría dentro
// del payload. El redondeo es presentación y vive en el panel, no en la cifra que va al motor.
