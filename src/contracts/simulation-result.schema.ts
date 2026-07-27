// src/contracts/simulation-result.schema.ts — contrato v1 de SimulationResult (Sección 07 del doc maestro)
// Respuesta que el motor entrega vía callback a /api/internal/jobs/:jobId (ADR-02/03).

import { z } from "zod";

const bandValueSchema = z.record(z.string(), z.number());

export const simulationSummarySchema = z
  .object({
    rt60: bandValueSchema.optional(),
    splAvgDb: z.number().optional(),
    splSigmaDb: z.number().optional(),
    c50AvgDb: z.number().optional(),
    d50AvgPct: z.number().optional(),
  })
  .catchall(z.number());

export const simulationGridSchema = z.object({
  points: z.array(z.tuple([z.number(), z.number(), z.number()])),
  valuesDbByBand: z.record(z.string(), z.array(z.number())).optional(),
  valuesDbA: z.array(z.number()).optional(),
});

export const simulationAlertSchema = z.object({
  metric: z.string(),
  level: z.enum(["ok", "warn", "err"]),
  zone: z.string().optional(),
  detail: z.unknown().optional(),
});

export const simulationRecommendationSchema = z.object({
  id: z.string(),
  rule: z.string(),
  priority: z.number().int(),
  action: z.record(z.string(), z.unknown()),
  evidence: z.record(z.string(), z.unknown()).optional(),
  text: z.string(),
});

export const simulationResultSchema = z.object({
  schemaVersion: z.literal("1"),
  jobId: z.string(),
  meta: z.object({
    engineVersion: z.string(),
    durationMs: z.number().nonnegative(),
    methodsUsed: z.array(z.string()),
    validity: z.object({
      schroederHz: z.number().positive(),
      warnings: z.array(z.string()),
    }),
  }),
  summary: simulationSummarySchema,
  grids: z.record(z.string(), simulationGridSchema).optional(),
  alerts: z.array(simulationAlertSchema),
  recommendations: z.array(simulationRecommendationSchema),
});

export type SimulationResult = z.infer<typeof simulationResultSchema>;

export const engineErrorCodeSchema = z.enum([
  "INVALID_PAYLOAD",
  "UNSUPPORTED_SCHEMA_VERSION",
  "GEOMETRY_INVALID",
  "BUDGET_EXCEEDED",
  "ENGINE_FAILURE",
  "LLM_UNAVAILABLE",
]);

export const engineErrorEnvelopeSchema = z.object({
  error: z.object({
    code: engineErrorCodeSchema,
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type EngineErrorEnvelope = z.infer<typeof engineErrorEnvelopeSchema>;
