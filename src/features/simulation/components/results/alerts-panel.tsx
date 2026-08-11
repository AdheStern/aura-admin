// src/features/simulation/components/results/alerts-panel.tsx — el semáforo por métrica (§5.4).
//
// El nivel va con icono y texto además de color: un semáforo que solo fuera color no lo lee ni
// quien no distingue rojo de verde ni quien lo imprime.
//
// Una métrica que el motor no calculó no aparece. No hay casilla en gris porque el contrato no
// tiene nivel para "no medido", y una casilla apagada se lee como "está bien".

import { CircleAlert, CircleCheck, OctagonAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SimulationAlert } from "@/contracts";
import { cn } from "@/lib/utils";

const LEVELS = {
  ok: {
    label: "Correcto",
    icon: CircleCheck,
    tone: "text-emerald-600 dark:text-emerald-400",
  },
  warn: {
    label: "Atención",
    icon: CircleAlert,
    tone: "text-amber-600 dark:text-amber-400",
  },
  err: { label: "Problema", icon: OctagonAlert, tone: "text-destructive" },
} as const;

const METRICS: Record<string, string> = {
  uniformity: "Uniformidad",
  c50: "Claridad de voz (C50)",
  c80: "Claridad musical (C80)",
};

export function AlertsPanel({ alerts }: { alerts: SimulationAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold">Alertas</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {alerts.map((alert) => (
          <AlertCard
            key={`${alert.metric}-${alert.zone ?? "global"}`}
            alert={alert}
          />
        ))}
      </div>
    </section>
  );
}

function AlertCard({ alert }: { alert: SimulationAlert }) {
  const level = LEVELS[alert.level];
  const Icon = level.icon;

  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium">
            {METRICS[alert.metric] ?? alert.metric}
          </span>
          <span className={cn("flex items-center gap-1 text-xs", level.tone)}>
            <Icon className="size-4" aria-hidden />
            {level.label}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          {alert.zone ? zoneLabel(alert.zone) : "Toda la audiencia"}
        </p>

        <AlertDetail detail={alert.detail} />
      </CardContent>
    </Card>
  );
}

/** Las cifras que sustentan el nivel. Sin ellas el semáforo es una opinión sin respaldo. */
function AlertDetail({ detail }: { detail: unknown }) {
  if (detail === null || typeof detail !== "object") return null;

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
      {Object.entries(detail as Record<string, unknown>).map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{key}</dt>
          <dd className="tabular-nums">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

/** El motor numera las zonas desde 0; el usuario las cuenta desde 1. */
function zoneLabel(zone: string): string {
  const match = /^audience_(\d+)$/.exec(zone);
  return match ? `Zona de audiencia ${Number(match[1]) + 1}` : zone;
}
