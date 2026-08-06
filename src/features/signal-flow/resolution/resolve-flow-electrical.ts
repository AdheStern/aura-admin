// src/features/signal-flow/resolution/resolve-flow-electrical.ts — el grafo, resuelto a fuentes.
//
// Es la salida de la tarea 3 y la entrada del compilador de SimulationRequest (Fase 4): produce
// TODO lo que el array `sources` del payload necesita salvo la posición y la rotación, que no viven
// en el grafo sino en el editor 3D. Esa es exactamente la frontera: el flujo de señal responde
// "qué caja, con cuánta potencia y reproduciendo qué"; el editor de recinto, "dónde y apuntando
// adónde".
//
// Solo entran las cajas conectadas al nodo simulation: una caja del rack sin esa arista está en el
// sistema pero no en la sala, y mandarla al motor la haría sonar donde el usuario no la puso.

import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";
import { buildGraphIndex } from "@/features/signal-flow/model/graph-index";
import type { ResolvedFlow } from "@/features/signal-flow/model/resolved-flow";
import { simulatedSpeakers } from "@/features/signal-flow/model/simulated-speakers";
import {
  type ProgramSpectrum,
  resolveProgramSpectrum,
} from "@/features/signal-flow/resolution/program-spectrum";
import {
  resolveSpeakerPower,
  type SpeakerPowerFailure,
} from "@/features/signal-flow/resolution/speaker-power";
import type { FlowIssueCode } from "@/features/signal-flow/validation/issue-codes";

/** Una fuente del SimulationRequest, sin los campos que aporta el editor 3D. */
export type ResolvedSpeakerSource = {
  nodeId: string;
  /** Trazabilidad al catálogo con el formato del contrato: "CatalogSpeaker:<id>". */
  catalogRef: string;
  spec: SpeakerSpec;
  electricalPowerW: number;
  programSpectrum: ProgramSpectrum;
  levelDb: number;
  polarityInverted: boolean;
  delayMs: number;
};

export type UnresolvedSpeaker = {
  nodeId: string;
  reason:
    | SpeakerPowerFailure
    | Extract<FlowIssueCode, "SPEAKER_WITHOUT_PROGRAM">;
};

export type FlowElectricalResolution =
  | { ok: true; sources: ResolvedSpeakerSource[] }
  | { ok: false; unresolved: UnresolvedSpeaker[] };

/**
 * Todo o nada: si una sola caja no resuelve, no hay payload que compilar.
 *
 * Un grafo que pasó validateSignalFlow nunca cae por aquí — cada motivo de fallo es un error que
 * ya bloqueó FLOW_READY. El resultado tipado existe porque esta función es invocable con cualquier
 * ResolvedFlow y callar el problema devolviendo una lista incompleta sería peor: el motor
 * simularía un sistema distinto al que el usuario dibujó, sin que nada lo delatara.
 */
export function resolveFlowElectrical(
  flow: ResolvedFlow,
): FlowElectricalResolution {
  const index = buildGraphIndex(flow);
  const sources: ResolvedSpeakerSource[] = [];
  const unresolved: UnresolvedSpeaker[] = [];

  for (const speaker of simulatedSpeakers(index)) {
    const power = resolveSpeakerPower(index, speaker.id);
    if (!power.ok) {
      unresolved.push({ nodeId: speaker.id, reason: power.reason });
      continue;
    }

    const programSpectrum = resolveProgramSpectrum(index, speaker.id);
    if (!programSpectrum) {
      unresolved.push({
        nodeId: speaker.id,
        reason: "SPEAKER_WITHOUT_PROGRAM",
      });
      continue;
    }

    // power.ok garantiza el spec resuelto, pero es un campo hermano y TS no lo correlaciona.
    if (!speaker.spec || speaker.data.catalogItemId === null) continue;

    sources.push({
      nodeId: speaker.id,
      catalogRef: `CatalogSpeaker:${speaker.data.catalogItemId}`,
      spec: speaker.spec,
      electricalPowerW: power.watts,
      programSpectrum,
      levelDb: speaker.data.levelDb,
      polarityInverted: speaker.data.polarityInverted,
      delayMs: speaker.data.delayMs,
    });
  }

  return unresolved.length > 0
    ? { ok: false, unresolved }
    : { ok: true, sources };
}
