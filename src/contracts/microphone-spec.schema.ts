// src/contracts/microphone-spec.schema.ts — contrato v1 de MicrophoneSpec (Sección 4.2 del doc maestro)
// Fuente de verdad TS de microphone-spec.schema.json, la copia espejo que comparte con aura-engine.
// Objetos laxos a propósito: regla (3) de ingesta — los campos desconocidos se preservan
// pero se ignoran, para que un datasheet más rico que el schema no sea rechazado.
//
// Sin directividad ni DI por banda: el micrófono no se simula acústicamente en v1 (el
// SimulationRequest solo transporta parlantes) y la realimentación —el único cálculo que
// necesitaría su patrón polar numérico— está diferida a v2 por el doc. El patrón polar viaja
// como etiqueta porque el nodo del flujo lo muestra, no porque se integre.

import { z } from "zod";
import { rangeHzSchema, responsePointSchema } from "./frequency-response";

export const microphoneSpecSchema = z
  .looseObject({
    schemaVersion: z.literal("1"),
    /** Tipo de transductor: la clasificación con la que se elige un micro en la práctica. */
    kind: z.enum(["dynamic", "condenser", "ribbon"]),

    polarPattern: z.enum([
      "omnidirectional",
      "cardioid",
      "supercardioid",
      "hypercardioid",
      "figure_8",
      "shotgun",
    ]),

    frequencyResponse: z.looseObject({
      rangeHz: rangeHzSchema,
      /** Misma tabulación que SpeakerSpec para que ambas curvas compartan gráfico. */
      curve: z.array(responsePointSchema).min(2),
    }),

    /** Sensibilidad en circuito abierto: mV de salida por pascal de presión sonora. */
    sensitivity: z.looseObject({
      mvPerPa: z.number().positive(),
    }),

    maxSpl: z.looseObject({
      dbSpl: z.number(),
      /** Distorsión a la que se mide ese máximo (0.5 % y 1 % son las referencias usuales). */
      thdPct: z.number().positive().optional(),
    }),

    // Ruido propio equivalente, ponderado A. Opcional porque los dinámicos y de cinta no lo
    // publican: son pasivos y su ruido lo domina el preamplificador, no la cápsula.
    selfNoise: z
      .looseObject({
        dbaSpl: z.number(),
      })
      .optional(),

    electrical: z.looseObject({
      impedanceOhm: z.number().positive(),
      phantomPowerRequired: z.boolean(),
      connector: z.string(),
    }),

    physical: z.looseObject({
      weightKg: z.number().positive(),
      /** Caja envolvente [ancho, alto, profundidad] en mm; sirve para cualquier formato. */
      dimensionsMm: z
        .tuple([
          z.number().positive(),
          z.number().positive(),
          z.number().positive(),
        ])
        .optional(),
    }),
  })
  .meta({
    title: "MicrophoneSpec v1",
    description:
      "Datasheet de un micrófono del catálogo. Alimenta el nodo microphone del flujo de señal " +
      "(1 entrada acústica → 1 salida) y su panel de specs; no llega al motor de simulación.",
  });

export type MicrophoneSpec = z.infer<typeof microphoneSpecSchema>;
