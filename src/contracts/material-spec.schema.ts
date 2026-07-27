// src/contracts/material-spec.schema.ts — contrato v1 de MaterialSpec (Sección 4.2 del doc maestro)
// Fuente de verdad TS de material-spec.schema.json, la copia espejo que comparte con aura-engine.

import { z } from "zod";
import { octaveBandKeySchema } from "./bands";

// α medido en cámara reverberante (ISO 354) supera 1.0 con cierta frecuencia por difracción
// de bordes; las tablas estándar traen valores como 1.05. Rechazarlos dejaría fuera material
// legítimo del catálogo, así que el tope es holgado y solo ataja errores de tipeo.
const absorptionByBandSchema = z.record(
  octaveBandKeySchema,
  z.number().min(0).max(1.2),
);

/** s es una fracción de energía dispersada: acotada a [0, 1] sin excepciones. */
const scatteringByBandSchema = z.record(
  octaveBandKeySchema,
  z.number().min(0).max(1),
);

export const materialSpecSchema = z
  .looseObject({
    schemaVersion: z.literal("1"),
    name: z.string().min(1),
    category: z.string().min(1),
    absorption: absorptionByBandSchema,
    scattering: scatteringByBandSchema,
    /** Procedencia de los coeficientes: exigida por el principio de "precisión honesta". */
    source: z.string().min(1),
    /** Derivado (promedio 250–2000 redondeado a 0.05); se recalcula, no se confía. */
    nrc: z.number().min(0).max(1.2).optional(),
  })
  .meta({
    title: "MaterialSpec v1",
    description:
      "Coeficientes por banda de octava de un material del catálogo: α (absorción) y " +
      "s (dispersión). Se asignan por superficie y gobiernan RT60 y la cola reverberante.",
  });

export type MaterialSpec = z.infer<typeof materialSpecSchema>;
