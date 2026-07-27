// src/contracts/simulation-request.schema.ts — contrato v1 de SimulationRequest (Sección 07 del doc maestro)
// Payload autocontenido que aura-admin envía a POST /v1/simulations (ADR-03).

import { z } from "zod";
import { materialSpecSchema } from "./material-spec.schema";
import { roomGeometrySchema } from "./room-geometry.schema";
import { speakerSpecSchema } from "./speaker-spec.schema";

export const simulationConfigSchema = z.object({
  mode: z.enum(["simple", "advanced"]),
  methods: z.array(z.enum(["statistical", "hybrid", "direct_field"])).min(1),
  bands: z.array(z.number().positive()).min(1),
  ism: z.object({ maxOrder: z.number().int().min(0) }).optional(),
  rayTracing: z
    .object({ nRays: z.number().int().positive(), seed: z.number().int() })
    .optional(),
  grid: z.object({
    resolutionM: z.number().positive(),
    earHeightM: z.number().positive(),
  }),
  summation: z.enum(["energy", "complex"]),
});

export const simulationEnvironmentSchema = z.object({
  temperatureC: z.number(),
  humidityPct: z.number().min(0).max(100),
  occupancyPct: z.number().min(0).max(100),
});

export const simulationSourceSchema = z.object({
  id: z.string(),
  catalogRef: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotationDeg: z.object({
    yaw: z.number(),
    pitch: z.number(),
    roll: z.number(),
  }),
  levelDb: z.number(),
  polarityInverted: z.boolean(),
  delayMs: z.number().nonnegative(),
  electricalPowerW: z.number().positive(),
  spec: speakerSpecSchema,
  programSpectrum: z.string(),
});

export const simulationLlmConfigSchema = z.object({
  provider: z.enum(["anthropic", "google", "deepseek"]),
  apiKey: z.string(),
  enabled: z.boolean(),
});

export const simulationRequestSchema = z.object({
  schemaVersion: z.literal("1"),
  jobId: z.string(),
  simulationId: z.string(),
  config: simulationConfigSchema,
  environment: simulationEnvironmentSchema,
  room: roomGeometrySchema,
  materials: z.record(z.string(), materialSpecSchema),
  sources: z.array(simulationSourceSchema).min(1),
  llm: simulationLlmConfigSchema.optional(),
});

export type SimulationRequest = z.infer<typeof simulationRequestSchema>;
