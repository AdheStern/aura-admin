// src/features/simulation/components/results/results-verdict.tsx — la respuesta, antes que los datos.
//
// Quien abre esto viene con UNA pregunta: ¿está bien la sala? La página entera responde a eso, pero
// repartido en nueve secciones; esta franja lo dice de una vez y deja las cifras para quien siga
// leyendo.
//
// El veredicto NO se calcula aquí: es el peor nivel de las alertas que ya trae el motor. Inventar
// un criterio propio en la vista sería una segunda opinión sin física detrás — y encima invisible.
//
// Las tres cifras que acompañan son las que un técnico mira primero: cuánto reverbera, a qué nivel
// suena y cuánto varía ese nivel por la audiencia.

import { CircleAlert, CircleCheck, OctagonAlert } from "lucide-react";
import type { SimulationAlert, SimulationSummary } from "@/contracts";
import { cn } from "@/lib/utils";

const LEVELS = {
  ok: {
    label: "La sala cumple",
    detail: "Ninguna métrica se sale de su rango.",
    icon: CircleCheck,
    tone: "text-emerald-600 dark:text-emerald-400",
    ring: "border-emerald-500/40 bg-emerald-500/5",
  },
  warn: {
    label: "La sala necesita ajustes",
    detail: "Hay métricas fuera de rango, ninguna crítica.",
    icon: CircleAlert,
    tone: "text-amber-600 dark:text-amber-400",
    ring: "border-amber-500/40 bg-amber-500/5",
  },
  err: {
    label: "La sala tiene problemas",
    detail: "Al menos una métrica está fuera de lo admisible.",
    icon: OctagonAlert,
    tone: "text-destructive",
    ring: "border-destructive/40 bg-destructive/5",
  },
} as const;

type Level = keyof typeof LEVELS;

export function ResultsVerdict({
  alerts,
  scalars,
  recommendationCount,
}: {
  alerts: SimulationAlert[];
  scalars: SimulationSummary;
  recommendationCount: number;
}) {
  const level = worstLevel(alerts);
  const { label, detail, icon: Icon, tone, ring } = LEVELS[level];

  return (
    <section
      className={cn(
        "flex flex-wrap items-center gap-x-8 gap-y-4 rounded-lg border p-4",
        ring,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon className={cn("mt-0.5 size-5 shrink-0", tone)} aria-hidden />
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold">{label}</h2>
          <p className="text-sm text-muted-foreground">
            {detail}
            {recommendationCount > 0
              ? ` Hay ${recommendationCount} ${recommendationCount === 1 ? "recomendación" : "recomendaciones"} más abajo.`
              : ""}
          </p>
        </div>
      </div>

      <dl className="flex shrink-0 flex-wrap gap-x-8 gap-y-3">
        <Figure
          label="RT60 (Sabine)"
          value={scalars.rt60SabineS}
          unit="s"
          digits={2}
        />
        <Figure label="Nivel medio" value={scalars.splAvgDb} unit="dBA" />
        <Figure label="Uniformidad (σ)" value={scalars.splSigmaDb} unit="dB" />
      </dl>
    </section>
  );
}

function Figure({
  label,
  value,
  unit,
  digits = 1,
}: {
  label: string;
  value: number | undefined;
  unit: string;
  digits?: number;
}) {
  // Una cifra que el motor no calculó se OMITE en vez de salir como "—": un hueco con guion se lee
  // como si valiera cero.
  if (typeof value !== "number") return null;

  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-heading text-xl font-semibold tabular-nums">
        {value.toFixed(digits)}
        <span className="ml-1 text-sm font-normal text-muted-foreground">
          {unit}
        </span>
      </dd>
    </div>
  );
}

/** El peor de todos: una sola métrica en rojo manda sobre cinco en verde. */
function worstLevel(alerts: SimulationAlert[]): Level {
  if (alerts.some((alert) => alert.level === "err")) return "err";
  return alerts.some((alert) => alert.level === "warn") ? "warn" : "ok";
}
