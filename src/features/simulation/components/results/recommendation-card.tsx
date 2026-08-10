// src/features/simulation/components/results/recommendation-card.tsx — un hallazgo y su acción.
//
// La evidencia va SIEMPRE visible bajo el texto, no plegada. Las cifras son lo único determinista
// de la tarjeta: el texto puede haberlo redactado un LLM, y aunque solo se le dan hechos ya
// calculados (ADR-05), la manera de que eso sea comprobable es enseñar los números al lado.
//
// El array llega ya ordenado por prioridad y aquí no se reordena.

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SimulationRecommendation } from "@/contracts";

const ACTIONS: Record<string, string> = {
  reposition_speaker: "Reorientar caja",
  review_coverage: "Revisar cobertura",
  treat_reflections: "Tratar reflexiones",
  reduce_level: "Bajar nivel",
  parametric_eq: "EQ paramétrica",
  delay_alignment: "Alinear delays",
  review_polarity: "Revisar polaridad",
};

export function RecommendationCard({
  recommendation,
}: {
  recommendation: SimulationRecommendation;
}) {
  const { action, evidence, text, priority, rule } = recommendation;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Prioridad {priority}</Badge>
          <Badge variant="outline">{ACTIONS[action.type] ?? action.type}</Badge>
          <span className="text-xs text-muted-foreground">{rule}</span>
        </div>

        <p className="text-sm">{text}</p>

        <ActionDetail action={action} />

        {evidence ? (
          <div className="rounded-md bg-muted/50 p-3">
            <p className="mb-1 text-xs font-medium">Evidencia</p>
            <KeyValues values={evidence} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Los parámetros concretos: qué caja, cuántos dB, a qué frecuencia. */
function ActionDetail({
  action,
}: {
  action: SimulationRecommendation["action"];
}) {
  const { type: _type, ...params } = action;
  if (Object.keys(params).length === 0) return null;

  return (
    <div className="rounded-md border p-3">
      <p className="mb-1 text-xs font-medium">Acción sugerida</p>
      <KeyValues values={params} />
    </div>
  );
}

function KeyValues({ values }: { values: Record<string, unknown> }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
      {Object.entries(values).map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{key}</dt>
          <dd className="tabular-nums break-all">{format(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function format(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return String(value);
}
