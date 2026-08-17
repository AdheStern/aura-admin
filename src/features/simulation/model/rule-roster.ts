// src/features/simulation/model/rule-roster.ts — las siete comprobaciones del motor y su veredicto.
//
// El motor devuelve SOLO las reglas que dispararon. Una lista de cuatro recomendaciones no distingue
// "se revisó y está bien" de "eso no está implementado", y esa ambigüedad llega a hacer dudar del
// producto entero: una escena con una sola caja calla tres reglas por motivos legítimos y parece que
// falten funciones. Este roster existe para poder enseñar también lo que se miró y salió limpio.
//
// Es una copia del inventario del motor y puede quedarse corta si allí nace una regla nueva. El
// error se acota en la dirección segura: una regla que dispara y no está listada se muestra igual,
// con su nombre crudo y sin descripción —nunca se pierde un hallazgo—, pero jamás se afirma que
// corrió una comprobación que el motor no tiene.
//
// El texto de cada una describe QUÉ LA DISPARA, no que su condición no se cumpliera: que una regla
// calle también puede significar que le faltó el dato para correr (la de modos necesita la banda de
// 125 Hz; la de polaridad, la grilla de cancelación). Enseñar el umbral y, cuando el resultado la
// trae, la medida real, es lo que se puede afirmar sin que el motor lo diga.

import type {
  SimulationAlert,
  SimulationRecommendation,
  SimulationSummary,
} from "@/contracts";

export type RuleCheck = {
  rule: string;
  label: string;
  /** Qué la dispara, con la medida real al lado cuando el resultado la trae. */
  trigger: string;
  fired: boolean;
};

export type RuleCheckContext = {
  recommendations: SimulationRecommendation[];
  alerts: SimulationAlert[];
  scalars: SimulationSummary;
  rtTargetS: readonly [number, number] | null;
  /** Con suma en energía no hay fase, así que no hay grilla de cancelación que mirar. */
  summation: "energy" | "complex" | null;
};

type RosterEntry = {
  rule: string;
  label: string;
  trigger: (context: RuleCheckContext) => string;
};

const ROSTER: RosterEntry[] = [
  {
    rule: "RtTargetRule",
    label: "Objetivo de reverberación",
    trigger: ({ rtTargetS }) =>
      rtTargetS
        ? `Dispara con bandas fuera de ${rtTargetS[0].toFixed(1)}–${rtTargetS[1].toFixed(1)} s.`
        : "Sin objetivo elegido no hay rango contra el que medir el RT60.",
  },
  {
    rule: "CoverageGapRule",
    label: "Cobertura y orientación de las cajas",
    trigger: ({ alerts }) => coverageTrigger(alerts),
  },
  {
    rule: "ClarityRule",
    label: "Claridad de la palabra",
    trigger: () =>
      "Dispara si más del 25 % de la audiencia baja de C50 = 2 dB.",
  },
  {
    rule: "RoomModeRule",
    label: "Modos de sala · EQ paramétrica",
    trigger: ({ scalars }) => modeTrigger(scalars.schroederHz),
  },
  {
    rule: "PolarityRule",
    label: "Polaridad y alineación de delays",
    trigger: ({ summation }) => polarityTrigger(summation),
  },
  {
    rule: "HeadroomRule",
    label: "Margen de las cajas · niveles",
    trigger: () =>
      "Dispara si una caja pide más de su SPL continuo menos 6 dB.",
  },
  {
    rule: "SourceEqRule",
    label: "EQ por instrumento",
    trigger: () => "Dispara con desvíos > 4 dB del espectro del programa.",
  },
];

export function buildRuleChecks(context: RuleCheckContext): RuleCheck[] {
  const fired = new Set(context.recommendations.map((item) => item.rule));

  const listed: RuleCheck[] = ROSTER.map((entry) => ({
    rule: entry.rule,
    label: entry.label,
    trigger: entry.trigger(context),
    fired: fired.has(entry.rule),
  }));

  const known = new Set(ROSTER.map((entry) => entry.rule));
  const unlisted: RuleCheck[] = [...fired]
    .filter((rule) => !known.has(rule))
    .map((rule) => ({ rule, label: rule, trigger: "", fired: true }));

  return [...listed, ...unlisted];
}

function coverageTrigger(alerts: SimulationAlert[]): string {
  const detail = alerts.find((alert) => alert.metric === "uniformity")?.detail;
  const limit = numberAt(detail, "okMaxDb") ?? 3;
  const sigma = numberAt(detail, "splSigmaDb");
  const base = `Dispara con σ(SPL) > ${limit.toFixed(1)} dB o zonas 6 dB bajo la mediana.`;

  return sigma === null ? base : `${base} Medido: ${sigma.toFixed(2)} dB.`;
}

// La suma en energía no lleva fase, así que el motor ni siquiera calcula la grilla de cancelación
// (ver direct_field.py). Con el preset simple esta regla no puede disparar NUNCA, y decir solo
// "hace falta más de una caja" mandaría a añadir una segunda para nada.
function polarityTrigger(summation: RuleCheckContext["summation"]): string {
  const base =
    "Dispara con cancelación > 6 dB entre cajas: hace falta más de una.";
  return summation === "energy"
    ? `${base} Esta corrida usó suma en energía, que no lleva fase: pide suma compleja en modo avanzado.`
    : base;
}

function modeTrigger(schroederHz: number | undefined): string {
  const base =
    "Dispara si se agrupan modos axiales bajo la frecuencia de Schroeder";
  return schroederHz === undefined
    ? `${base}.`
    : `${base} (${schroederHz.toFixed(1)} Hz).`;
}

function numberAt(detail: unknown, key: string): number | null {
  if (typeof detail !== "object" || detail === null) return null;

  const value = (detail as Record<string, unknown>)[key];
  return typeof value === "number" ? value : null;
}
