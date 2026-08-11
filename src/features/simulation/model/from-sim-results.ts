// src/features/simulation/model/from-sim-results.ts — vuelve a juntar las filas SimResult.
//
// Inverso de to-sim-results.ts. Pura, para que la vista se pueda asertar sin base de datos.
//
// Reparsea con los sub-schemas del contrato en vez de confiar en la columna: entre que se escribió
// y que se lee puede haber pasado un despliegue del motor con un contrato más nuevo, y la política
// laxa de la salida existe justo para que eso no tumbe la lectura de resultados ya calculados.

import { z } from "zod";
import {
  type SimulationAlert,
  type SimulationGrid,
  type SimulationMeta,
  type SimulationRecommendation,
  type SimulationSummary,
  simulationAlertSchema,
  simulationGridSchema,
  simulationMetaSchema,
  simulationRecommendationSchema,
  simulationSummarySchema,
} from "@/contracts";
import type { ResultKind } from "@/features/simulation/model/to-sim-results";

export type SimResultRecord = {
  kind: string;
  summary: unknown;
  payload: unknown;
};

export type SimulationView = {
  meta: SimulationMeta | null;
  scalars: SimulationSummary;
  bands: Pick<SimulationSummary, "rt60" | "edt" | "c50" | "c80">;
  splGrid: SimulationGrid | null;
  cancellationGrid: SimulationGrid | null;
  clarityGrids: { c50: SimulationGrid | null; c80: SimulationGrid | null };
  alerts: SimulationAlert[];
  recommendations: SimulationRecommendation[];
};

const summaryRowSchema = simulationSummarySchema.extend({
  meta: simulationMetaSchema.optional(),
});

const bandsRowSchema = simulationSummarySchema.pick({
  rt60: true,
  edt: true,
  c50: true,
  c80: true,
});

const gridPayloadSchema = z.looseObject({
  spl: simulationGridSchema.optional(),
  cancellation: simulationGridSchema.optional(),
  c50: simulationGridSchema.optional(),
  c80: simulationGridSchema.optional(),
});

export function fromSimResults(rows: SimResultRecord[]): SimulationView {
  const by = (kind: ResultKind) => rows.find((row) => row.kind === kind);

  const summary = summaryRowSchema.safeParse(by("SUMMARY")?.summary);
  const { meta, ...scalars } = summary.success ? summary.data : {};
  const bands = bandsRowSchema.safeParse(by("RT_BANDS")?.summary);
  const spl = gridPayloadSchema.safeParse(by("SPL_GRID")?.payload);
  const clarity = gridPayloadSchema.safeParse(by("CLARITY_GRID")?.payload);

  return {
    meta: meta ?? null,
    scalars,
    bands: bands.success ? bands.data : {},
    splGrid: spl.success ? (spl.data.spl ?? null) : null,
    cancellationGrid: spl.success ? (spl.data.cancellation ?? null) : null,
    clarityGrids: {
      c50: clarity.success ? (clarity.data.c50 ?? null) : null,
      c80: clarity.success ? (clarity.data.c80 ?? null) : null,
    },
    alerts: parseArray(by("ALERTS")?.summary, simulationAlertSchema),
    recommendations: parseArray(
      by("RECOMMENDATIONS")?.payload,
      simulationRecommendationSchema,
    ),
  };
}

/** Fila ausente y fila ilegible dan lo mismo: una sección que no se pinta. */
function parseArray<T>(value: unknown, schema: z.ZodType<T>): T[] {
  const parsed = z.array(schema).safeParse(value);
  return parsed.success ? parsed.data : [];
}
