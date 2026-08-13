// src/features/simulation/model/to-sim-results.ts — reparte un SimulationResult en filas SimResult.
//
// Función PURA: la ruta de callback la usa para persistir, y así lo que se guarda se puede asertar
// sin base de datos ni servidor.
//
// Una fila por `kind` en vez de un blob: el resumen se lista y se consulta, mientras que las
// grillas solo se leen al abrir la vista de resultados. Y una métrica que el motor no calculó no
// genera fila — igual que no emite alerta: una casilla vacía no es información.

import type { SimulationResult } from "@/contracts";

// Los seis primeros son los del doc y los produce `toSimResults` a partir del resultado del motor.
// MIX_ADVICE no: lo escribe la app desde generate-mix-advice.ts y el motor no lo emite nunca —el
// kind es propiedad de la app, y esta fila es la prueba. Se GUARDA en vez de regenerarse en cada
// visita por dos razones: la llamada la paga el usuario con su clave, y lo que se enseñe en la
// defensa tiene que poder volver a enseñarse igual. Va colgado de la simulación, que está
// congelada, así que el consejo describe siempre la misma física; regenerar es un botón.
export type ResultKind =
  | "SUMMARY"
  | "RT_BANDS"
  | "SPL_GRID"
  | "CLARITY_GRID"
  | "ALERTS"
  | "RECOMMENDATIONS"
  | "MIX_ADVICE";

export type SimResultRow = {
  kind: ResultKind;
  summary: unknown | null;
  /** Denso. El doc manda a storagePath por encima de 1 MB; en v1 no se alcanza (ver abajo). */
  payload: unknown | null;
};

const BAND_METRICS = ["rt60", "edt", "c50", "c80"] as const;

export function toSimResults(result: SimulationResult): SimResultRow[] {
  const { rt60, edt, c50, c80, ...scalars } = result.summary;
  const bands = { rt60, edt, c50, c80 };
  const grids = result.grids ?? {};

  const rows: SimResultRow[] = [
    row("SUMMARY", { meta: result.meta, ...scalars }, null),
  ];

  if (BAND_METRICS.some((metric) => bands[metric] !== undefined)) {
    rows.push(row("RT_BANDS", bands, null));
  }

  // `cancellation` viaja con `spl` y no en una fila propia: lo produce el mismo direct_field, sobre
  // los mismos puntos, y los seis kinds del doc no tienen nombre para él.
  if (grids.spl) {
    const spl = { spl: grids.spl, cancellation: grids.cancellation };
    rows.push(row("SPL_GRID", pointCount(grids.spl), spl));
  }

  if (grids.c50 || grids.c80) {
    const clarity = { c50: grids.c50, c80: grids.c80 };
    rows.push(row("CLARITY_GRID", pointCount(grids.c50 ?? grids.c80), clarity));
  }

  if (result.alerts.length > 0) {
    rows.push(row("ALERTS", result.alerts, null));
  }

  if (result.recommendations.length > 0) {
    rows.push(
      row(
        "RECOMMENDATIONS",
        recommendationIndex(result),
        result.recommendations,
      ),
    );
  }

  return rows;
}

function row(
  kind: ResultKind,
  summary: unknown,
  payload: unknown,
): SimResultRow {
  return { kind, summary: summary ?? null, payload: payload ?? null };
}

function pointCount(grid: { points: unknown[] } | undefined): {
  points: number;
} {
  return { points: grid?.points.length ?? 0 };
}

/** Lo justo para listar y ordenar sin traerse la evidencia entera. El array ya viene por prioridad. */
function recommendationIndex(result: SimulationResult) {
  return result.recommendations.map(({ id, rule, priority }) => ({
    id,
    rule,
    priority,
  }));
}
