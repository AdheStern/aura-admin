// src/features/simulation/model/mix-context.ts — el resumen de física que ve la IA.
//
// Lo que NO entra es tan importante como lo que entra: las grillas densas (42 puntos × 6 bandas por
// métrica) queman contexto sin aportar un criterio que un asesor de mezcla pueda usar. De la grilla
// solo sale un número por banda; el resto son escalares que ya estaban calculados.
//
// Sí entran, y el MVP no las tenía, las RECOMENDACIONES DETERMINISTAS ya emitidas. Sin ellas la IA
// puede proponer lo contrario que las siete reglas —bajar 4 kHz donde SourceEqRule mandó subirlo— y
// la pantalla acabaría enseñando dos consejos opuestos sin decir cuál manda.
//
// El SPL por banda se promedia en ENERGÍA, no en dB: la media aritmética de decibelios no es el
// nivel medio de un área, subestima allí donde hay picos. Un dato mal promediado sería peor que no
// mandarlo, porque parece igual de fiable.

import type { SimulationAlert, SimulationRecommendation } from "@/contracts";
import type { SimulationView } from "@/features/simulation/model/from-sim-results";

export type MixContext = {
  rt60ByBandS: Record<string, number>;
  rt60MidS: number | null;
  c50ByBandDb: Record<string, number>;
  c80ByBandDb: Record<string, number>;
  splByBandDb: Record<string, number>;
  scalars: Record<string, number>;
  alerts: { metric: string; level: string; zone?: string }[];
  /** Los avisos de validez del motor: dicen dónde deja de valer lo de arriba. */
  validityWarnings: string[];
  schroederHz: number | null;
  deterministic: { rule: string; action: string; text: string }[];
};

/** Escalares que un asesor de mezcla puede usar. Los demás no le dicen nada y ocupan contexto. */
const SCALAR_KEYS = [
  "splAvgDb",
  "splSigmaDb",
  "splMinDb",
  "splMaxDb",
  "c50AvgDb",
  "c80AvgDb",
  "d50AvgPct",
  "drrAvgDb",
  "criticalDistanceM",
  "roomConstantM2",
] as const;

export function buildMixContext(view: SimulationView): MixContext {
  const { bands, scalars, splGrid } = view;

  return {
    rt60ByBandS: round(bands.rt60, 2),
    rt60MidS: midBand(bands.rt60),
    c50ByBandDb: round(bands.c50, 1),
    c80ByBandDb: round(bands.c80, 1),
    splByBandDb: energyMeanByBand(splGrid?.valuesDbByBand),
    scalars: pickScalars(scalars),
    alerts: view.alerts.map(summariseAlert),
    validityWarnings: view.meta?.validity.warnings ?? [],
    schroederHz: scalars.schroederHz ?? null,
    deterministic: view.recommendations.map(summariseRecommendation),
  };
}

/** RT60 medio = media de 500 y 1000 Hz, que es como se cita el tiempo de reverberación de una sala. */
function midBand(rt60: Record<string, number> | undefined): number | null {
  const mid = [rt60?.["500"], rt60?.["1000"]].filter(
    (value): value is number => typeof value === "number",
  );
  if (mid.length === 0) return null;

  const mean = mid.reduce((total, value) => total + value, 0) / mid.length;
  return Number(mean.toFixed(2));
}

/** 10·log10(⟨10^(L/10)⟩): la media que respeta que los decibelios son logarítmicos. */
function energyMeanByBand(
  byBand: Record<string, number[]> | undefined,
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [band, values] of Object.entries(byBand ?? {})) {
    if (values.length === 0) continue;

    const energy =
      values.reduce((total, db) => total + 10 ** (db / 10), 0) / values.length;
    result[band] = Number((10 * Math.log10(energy)).toFixed(1));
  }
  return result;
}

function pickScalars(scalars: Record<string, unknown>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const key of SCALAR_KEYS) {
    const value = scalars[key];
    if (typeof value === "number") result[key] = Number(value.toFixed(2));
  }
  return result;
}

function round(
  byBand: Record<string, number> | undefined,
  decimals: number,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(byBand ?? {}).map(([band, value]) => [
      band,
      Number(value.toFixed(decimals)),
    ]),
  );
}

function summariseAlert(alert: SimulationAlert) {
  return { metric: alert.metric, level: alert.level, zone: alert.zone };
}

/** El texto y la acción, sin la evidencia: la IA necesita saber QUÉ se mandó, no recalcularlo. */
function summariseRecommendation(recommendation: SimulationRecommendation) {
  return {
    rule: recommendation.rule,
    action: recommendation.action.type,
    text: recommendation.text,
  };
}
