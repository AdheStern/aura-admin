// src/contracts/speaker-spec.schema.ts — contrato v1 de SpeakerSpec (Sección 4.2 del doc maestro)
// Espejo TS del speaker-spec.schema.json que vivirá en aura-engine/contracts.

import { z } from "zod";

const dbByBandSchema = z.record(z.string(), z.number());

export const speakerSpecSchema = z.object({
  schemaVersion: z.literal("1"),
  kind: z.enum(["point_source", "line_array_element", "subwoofer", "monitor"]),
  transducers: z.object({
    lf: z.string().optional(),
    hf: z.string().optional(),
  }),
  power: z.object({
    continuousW: z.number().positive(),
    programW: z.number().positive(),
    peakW: z.number().positive(),
    impedanceOhm: z.number().positive(),
  }),
  sensitivity: z.object({
    dbSpl1w1m: z.number(),
    reference: z.string(),
  }),
  maxSpl: z.object({
    continuousDb: z.number(),
    peakDb: z.number(),
  }),
  frequencyResponse: z.object({
    rangeHz: z.tuple([z.number().positive(), z.number().positive()]),
    toleranceDb: z.number().nonnegative(),
    curve: z.array(z.tuple([z.number().positive(), z.number()])),
  }),
  directivity: z.object({
    nominalCoverage: z.object({
      hDeg: z.number().min(0).max(360),
      vDeg: z.number().min(0).max(360),
    }),
    diByBand: dbByBandSchema,
    balloon: z.unknown().nullable().optional(),
  }),
  physical: z.object({
    weightKg: z.number().positive(),
    dimensionsMm: z.tuple([
      z.number().positive(),
      z.number().positive(),
      z.number().positive(),
    ]),
    rigging: z.boolean(),
  }),
  electrical: z.object({
    connectors: z.array(z.string()),
    activePowered: z.boolean(),
  }),
});

export type SpeakerSpec = z.infer<typeof speakerSpecSchema>;
