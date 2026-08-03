// src/contracts/console-spec.schema.ts — contrato v1 de ConsoleSpec (Sección 4.2 del doc maestro)
// Fuente de verdad TS de console-spec.schema.json, la copia espejo que comparte con aura-engine.
// Objetos laxos a propósito: regla (3) de ingesta — los campos desconocidos se preservan
// pero se ignoran, para que un datasheet más rico que el schema no sea rechazado.
//
// io.inputChannels/outputBuses son load-bearing: el nodo console del flujo hereda de aquí su
// número de handles (Sección 5.1). Cambiar esos campos rompe grafos ya guardados, no solo la vista.

import { z } from "zod";

/** Rango [mínimo, máximo] en dB de un control de nivel. */
const rangeDbSchema = z.tuple([z.number(), z.number()]);

export const consoleSpecSchema = z
  .looseObject({
    schemaVersion: z.literal("1"),
    kind: z.enum(["analog", "digital"]),

    io: z.looseObject({
      /** N handles de entrada del nodo. */
      inputChannels: z.number().int().positive(),
      /** M handles de salida del nodo: solo los buses, no los envíos auxiliares. */
      outputBuses: z.number().int().positive(),
      // auxSends y matrixOutputs son informativos en v1: el doc modela la consola como N→M y
      // el grafo no rutea envíos todavía. Se declaran para que el datasheet no mienta por omisión.
      auxSends: z.number().int().nonnegative().optional(),
      matrixOutputs: z.number().int().nonnegative().optional(),
    }),

    // Rangos disponibles en el equipo, no los valores de una escena: el trim y el fader que se
    // aplican a cada canal son datos del nodo en el grafo, no del catálogo.
    gain: z.looseObject({
      trimRangeDb: rangeDbSchema,
      faderRangeDb: rangeDbSchema,
    }),

    phantomPower: z.looseObject({
      available: z.boolean(),
      /** true si se conmuta canal a canal; false si es global o por bloques. */
      perChannel: z.boolean(),
    }),

    physical: z.looseObject({
      weightKg: z.number().positive(),
      rackUnits: z.number().int().positive().optional(),
    }),
  })
  .meta({
    title: "ConsoleSpec v1",
    description:
      "Datasheet de una consola del catálogo. Alimenta el nodo console del flujo de señal: de " +
      "io salen sus handles (N entradas → M buses) y de gain los rangos de trim y fader.",
  });

export type ConsoleSpec = z.infer<typeof consoleSpecSchema>;
