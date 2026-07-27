// src/contracts/simulation-result.schema.ts — contrato v1 de SimulationResult (Sección 07)
// Fuente de verdad TS de simulation-result.schema.json (copia espejo en aura-engine).
// Laxo a propósito: el procedimiento de cambio de contrato despliega PRIMERO el motor y
// después la app, así que durante esa ventana la app recibe resultados de un motor más nuevo.
// Un campo de más nunca debe tumbar la lectura de resultados ya calculados.

import { z } from "zod";
import { octaveBandKeySchema, partialByBandSchema } from "./bands";

/** Lo que el motor realmente corrió: statistical se resuelve a sabine o eyring según ᾱ. */
export const simulationMethodUsedSchema = z.enum([
  "sabine",
  "eyring",
  "hybrid",
  "direct_field",
]);

export const simulationMetaSchema = z.looseObject({
  engineVersion: z.string().min(1),
  durationMs: z.number().nonnegative(),
  methodsUsed: z.array(simulationMethodUsedSchema).min(1),
  /** Margen de validez declarado: por debajo de schroederHz la geometría pierde sentido. */
  validity: z.looseObject({
    schroederHz: z.number().positive(),
    warnings: z.array(z.string()),
  }),
});

// Métricas agregadas consultables. Todo opcional: qué se calcula depende de los métodos
// pedidos (un run solo estadístico no produce C50). Los escalares del bloque final son las
// magnitudes de CANON-01 (Apéndice A.1) — llevan unidad en el nombre por la regla de la §9.
export const simulationSummarySchema = z.looseObject({
  rt60: partialByBandSchema.optional(),
  edt: partialByBandSchema.optional(),
  c50: partialByBandSchema.optional(),
  c80: partialByBandSchema.optional(),

  splAvgDb: z.number().optional(),
  splSigmaDb: z.number().optional(),
  splMinDb: z.number().optional(),
  splMaxDb: z.number().optional(),
  c50AvgDb: z.number().optional(),
  c80AvgDb: z.number().optional(),
  d50AvgPct: z.number().optional(),
  drrAvgDb: z.number().optional(),

  soundSpeedMps: z.number().optional(),
  rt60SabineS: z.number().optional(),
  rt60EyringS: z.number().optional(),
  schroederHz: z.number().optional(),
  roomConstantM2: z.number().optional(),
  criticalDistanceM: z.number().optional(),
  soundPowerLevelDb: z.number().optional(),
  splDirectDb: z.number().optional(),
  splReverberantDb: z.number().optional(),
  splTotalDb: z.number().optional(),
});

/** Datos densos por punto de escucha. Si supera 1 MB se persiste en Storage (ADR-04). */
export const simulationGridSchema = z.looseObject({
  points: z.array(z.tuple([z.number(), z.number(), z.number()])),
  /** Un array por banda, alineado índice a índice con points. */
  valuesDbByBand: z
    .partialRecord(octaveBandKeySchema, z.array(z.number()))
    .optional(),
  valuesDbA: z.array(z.number()).optional(),
});

export const simulationAlertSchema = z.looseObject({
  metric: z.string().min(1),
  level: z.enum(["ok", "warn", "err"]),
  zone: z.string().optional(),
  detail: z.unknown().optional(),
});

// Recomendación determinista: las cifras salen de las reglas de física (ADR-05); el LLM,
// si está habilitado, solo redacta `text` sobre estos hechos ya calculados.
export const simulationRecommendationSchema = z.looseObject({
  id: z.string().min(1),
  rule: z.string().min(1),
  priority: z.number().int(),
  action: z.looseObject({ type: z.string().min(1) }),
  evidence: z.record(z.string(), z.unknown()).optional(),
  text: z.string(),
});

export const simulationResultSchema = z
  .looseObject({
    schemaVersion: z.literal("1"),
    jobId: z.string().min(1),
    meta: simulationMetaSchema,
    summary: simulationSummarySchema,
    /** Indexadas por métrica: "spl", "c50", … */
    grids: z.record(z.string(), simulationGridSchema).optional(),
    alerts: z.array(simulationAlertSchema),
    recommendations: z.array(simulationRecommendationSchema),
  })
  .meta({
    title: "SimulationResult v1",
    description:
      "Resultado que el motor entrega por callback a /api/internal/jobs/:jobId: métricas " +
      "agregadas, grillas densas, alertas y recomendaciones deterministas.",
  });

export type SimulationMeta = z.infer<typeof simulationMetaSchema>;
export type SimulationSummary = z.infer<typeof simulationSummarySchema>;
export type SimulationGrid = z.infer<typeof simulationGridSchema>;
export type SimulationAlert = z.infer<typeof simulationAlertSchema>;
export type SimulationRecommendation = z.infer<
  typeof simulationRecommendationSchema
>;
export type SimulationResult = z.infer<typeof simulationResultSchema>;

/** LLM_UNAVAILABLE nunca falla el job: degrada a plantillas de texto. */
export const engineErrorCodeSchema = z.enum([
  "INVALID_PAYLOAD",
  "UNSUPPORTED_SCHEMA_VERSION",
  "GEOMETRY_INVALID",
  "BUDGET_EXCEEDED",
  "ENGINE_FAILURE",
  "LLM_UNAVAILABLE",
]);

export const engineErrorEnvelopeSchema = z
  .looseObject({
    error: z.looseObject({
      code: engineErrorCodeSchema,
      message: z.string(),
      details: z.unknown().optional(),
    }),
  })
  .meta({
    title: "EngineError v1",
    description:
      "Envelope uniforme de error del motor, en cualquier endpoint de /v1.",
  });

export type EngineErrorCode = z.infer<typeof engineErrorCodeSchema>;
export type EngineErrorEnvelope = z.infer<typeof engineErrorEnvelopeSchema>;
