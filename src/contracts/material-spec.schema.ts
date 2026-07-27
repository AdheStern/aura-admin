// src/contracts/material-spec.schema.ts — contrato v1 de MaterialSpec (Sección 4.2 del doc maestro)
// Espejo TS del material-spec.schema.json que vivirá en aura-engine/contracts.

import { z } from "zod";

const coefficientByBandSchema = z.record(z.string(), z.number().min(0).max(1));

export const materialSpecSchema = z.object({
  schemaVersion: z.literal("1"),
  name: z.string(),
  category: z.string(),
  absorption: coefficientByBandSchema,
  scattering: coefficientByBandSchema,
  source: z.string(),
  nrc: z.number().min(0).max(1).optional(),
});

export type MaterialSpec = z.infer<typeof materialSpecSchema>;
