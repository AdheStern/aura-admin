// src/contracts/speaker-spec.schema.ts — contrato v1 de SpeakerSpec (Sección 4.2 del doc maestro)
// Fuente de verdad TS de speaker-spec.schema.json, la copia espejo que comparte con aura-engine.
// Objetos laxos a propósito: regla (3) de ingesta — los campos desconocidos se preservan
// pero se ignoran, para que un datasheet más rico que el schema no sea rechazado.

import { z } from "zod";
import { octaveBandKeySchema, partialByBandSchema } from "./bands";
import { rangeHzSchema, responsePointSchema } from "./frequency-response";

/** Balloon data opcional: [banda][azimut][elevación] en dB, si el fabricante la publica. */
const balloonSchema = z.partialRecord(
  octaveBandKeySchema,
  z.array(z.array(z.number())),
);

export const speakerSpecSchema = z
  .looseObject({
    schemaVersion: z.literal("1"),
    kind: z.enum([
      "point_source",
      "line_array_element",
      "subwoofer",
      "monitor",
    ]),

    transducers: z.looseObject({
      lf: z.string().optional(),
      hf: z.string().optional(),
    }),

    power: z.looseObject({
      continuousW: z.number().positive(),
      programW: z.number().positive(),
      peakW: z.number().positive(),
      impedanceOhm: z.number().positive(),
    }),

    sensitivity: z.looseObject({
      dbSpl1w1m: z.number(),
      /** Referencia declarada por el fabricante ("1W/1m" | "2.83V/1m"): informativa. */
      reference: z.string(),
    }),

    maxSpl: z.looseObject({
      continuousDb: z.number(),
      peakDb: z.number(),
    }),

    frequencyResponse: z.looseObject({
      rangeHz: rangeHzSchema,
      toleranceDb: z.number().nonnegative(),
      /** Fuera de rangeHz el motor extrapola a −12 dB/octava (Apéndice A.3). */
      curve: z.array(responsePointSchema).min(2),
    }),

    directivity: z.looseObject({
      /** Ángulo TOTAL a −6 dB por plano — así lo interpreta el modelo de A.2. */
      nominalCoverage: z.looseObject({
        hDeg: z.number().positive().max(360),
        vDeg: z.number().positive().max(360),
      }),
      /** DI por banda → Q en las fórmulas estadísticas (Lw, d_c). Parcial: solo lo publicado. */
      diByBand: partialByBandSchema,
      balloon: balloonSchema.nullable().optional(),
    }),

    physical: z.looseObject({
      weightKg: z.number().positive(),
      /** [ancho, alto, profundidad] en mm. */
      dimensionsMm: z.tuple([
        z.number().positive(),
        z.number().positive(),
        z.number().positive(),
      ]),
      rigging: z.boolean(),
    }),

    electrical: z.looseObject({
      connectors: z.array(z.string()),
      activePowered: z.boolean(),
    }),
  })
  .meta({
    title: "SpeakerSpec v1",
    description:
      "Datasheet de un parlante del catálogo. Alimenta el campo directo (sensibilidad, " +
      "respuesta, directividad) y los límites de headroom de la simulación.",
  });

export type SpeakerSpec = z.infer<typeof speakerSpecSchema>;
