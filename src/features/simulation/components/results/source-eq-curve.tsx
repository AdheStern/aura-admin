// src/features/simulation/components/results/source-eq-curve.tsx — adapta la acción `source_eq`
// del motor a la gráfica del paramétrico.
//
// Existe separado de la gráfica para que ésta siga siendo genérica: la EQ de sala (`parametric_eq`
// de RoomModeRule) es otra acción con otra forma y va a querer la MISMA curva. Traducir cada una
// desde su propio adaptador es lo que evita un componente de gráfica lleno de ifs por tipo.
//
// El motor manda una Q única para todos los filtros porque corrige por bandas de octava enteras
// (1.41 ≈ una octava). Si algún día mandara una Q por banda, es aquí donde se reparte.

import type { SimulationRecommendation } from "@/contracts";
import { EqCurveChart } from "@/features/simulation/components/results/eq-curve-chart";
import {
  deviationByBand,
  parseSourceEqAction,
} from "@/features/simulation/schemas/source-eq-action";

export function SourceEqCurve({
  action,
  evidence,
}: {
  action: SimulationRecommendation["action"];
  evidence: SimulationRecommendation["evidence"];
}) {
  const parsed = parseSourceEqAction(action);
  if (!parsed) return null;

  const bands = Object.entries(parsed.gainDbByBand).map(([band, gainDb]) => ({
    frequencyHz: Number(band),
    gainDb,
    q: parsed.q,
  }));

  return (
    <EqCurveChart bands={bands} deviationByBand={deviationByBand(evidence)} />
  );
}
