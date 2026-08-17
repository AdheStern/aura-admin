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
import { ApplyOrientationButton } from "@/features/simulation/components/results/apply-orientation-button";
import { EvidenceList } from "@/features/simulation/components/results/evidence-list";
import { SourceEqCurve } from "@/features/simulation/components/results/source-eq-curve";
import { TreatmentOptions } from "@/features/simulation/components/results/treatment-options";
import {
  humaniseSourceIds,
  type SourceNames,
} from "@/features/simulation/model/source-names";
import type { Treatment } from "@/features/simulation/queries/resolve-treatment";
import { isRepositionAction } from "@/features/simulation/schemas/reposition-action";

const ACTIONS: Record<string, string> = {
  reposition_speaker: "Reorientar caja",
  review_coverage: "Revisar cobertura",
  treat_reflections: "Tratar reflexiones",
  reduce_level: "Bajar nivel",
  parametric_eq: "EQ paramétrica",
  // La séptima regla (SourceEqRule) corrige el espectro de una FUENTE, no el de la sala: son dos
  // ecualizaciones distintas y llamarlas igual haría pensar que una sustituye a la otra.
  source_eq: "EQ de fuente",
  delay_alignment: "Alinear delays",
  review_polarity: "Revisar polaridad",
  add_absorption: "Añadir absorción",
  reduce_absorption: "Quitar absorción",
};

export function RecommendationCard({
  recommendation,
  simulationId,
  canApply,
  treatment,
  sourceNames,
}: {
  recommendation: SimulationRecommendation;
  simulationId: string;
  /** Aplicar escribe en el recinto, así que es cosa de OWNER/EDITOR. */
  canApply: boolean;
  /** Solo en las de absorción, y solo si algo del catálogo cabe en alguna superficie. */
  treatment?: Treatment;
  /** Para cambiar los ids de nodo del texto y la evidencia por el nombre de la caja. */
  sourceNames: SourceNames;
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

        <p className="text-sm">{humaniseSourceIds(text, sourceNames)}</p>

        <SourceEqCurve action={action} evidence={evidence} />

        <ActionDetail action={action} sourceNames={sourceNames} />

        {treatment ? <TreatmentOptions treatment={treatment} /> : null}

        {evidence ? (
          <div className="rounded-md bg-muted/50 p-3">
            <p className="mb-1 text-xs font-medium">Evidencia</p>
            <EvidenceList values={evidence} sourceNames={sourceNames} />
          </div>
        ) : null}

        {/* Solo la propuesta de reorientación es ejecutable: las demás (tratar reflexiones, EQ de
            sala) describen obra o ajuste fuera de la app, y un botón que no hace nada sería peor
            que ninguno. */}
        {canApply && isRepositionAction(action) ? (
          <ApplyOrientationButton
            simulationId={simulationId}
            recommendationId={recommendation.id}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Los parámetros concretos: qué caja, cuántos dB, a qué frecuencia. */
function ActionDetail({
  action,
  sourceNames,
}: {
  action: SimulationRecommendation["action"];
  sourceNames: SourceNames;
}) {
  const { type: _type, ...params } = action;
  if (Object.keys(params).length === 0) return null;

  return (
    <div className="rounded-md border p-3">
      <p className="mb-1 text-xs font-medium">Acción sugerida</p>
      <EvidenceList values={params} sourceNames={sourceNames} />
    </div>
  );
}
