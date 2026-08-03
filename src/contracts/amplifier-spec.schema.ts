// src/contracts/amplifier-spec.schema.ts — contrato v1 de AmplifierSpec (Sección 4.2 del doc maestro)
// Fuente de verdad TS de amplifier-spec.schema.json, la copia espejo que comparte con aura-engine.
// Objetos laxos a propósito: regla (3) de ingesta — los campos desconocidos se preservan
// pero se ignoran, para que un datasheet más rico que el schema no sea rechazado.
//
// El único de los tres contratos de equipo cuyo dato llega a la simulación: resolver el grafo
// PA→parlante produce el electricalPowerW del SimulationRequest (Secciones 5.1 y 07).

import { z } from "zod";

// La potencia entregada depende de la impedancia de la carga, así que se indexa por ella: el
// grafo cruza estas cifras con SpeakerSpec.power.impedanceOhm del parlante conectado.
// 8Ω es obligatorio por ser la carga de referencia que todo fabricante publica; el resto son
// opcionales. Deliberadamente NO se modela como partialRecord + refine("al menos una clave"):
// z.toJSONSchema no representa los refine, y el .schema.json que se copia al motor quedaría
// más débil que el zod — justo la deriva silenciosa que el test de drift existe para impedir.
const powerPerChannelWSchema = z.looseObject({
  "8": z.number().positive(),
  "4": z.number().positive().optional(),
  "2": z.number().positive().optional(),
  "16": z.number().positive().optional(),
});

export const amplifierSpecSchema = z
  .looseObject({
    schemaVersion: z.literal("1"),
    /** El doc llama al nodo "pa (amplificador/procesador)": con DSP integrado o sin él. */
    kind: z.enum(["amplifier", "amplifier_dsp"]),

    io: z.looseObject({
      /** N handles de entrada del nodo. */
      inputChannels: z.number().int().positive(),
      /** M handles de salida: cada uno alimenta un parlante del grafo. */
      outputChannels: z.number().int().positive(),
    }),

    powerPerChannelW: powerPerChannelWSchema,

    /** Modo puente: suma dos canales sobre una carga. Reduce los handles útiles a la mitad. */
    bridgeable: z.boolean(),

    processing: z.looseObject({
      dsp: z.boolean(),
      crossover: z.boolean(),
      limiter: z.boolean(),
      delayMaxMs: z.number().nonnegative().optional(),
    }),

    electrical: z.looseObject({
      mainsVoltageV: z.number().positive(),
      connectors: z.array(z.string()),
    }),

    physical: z.looseObject({
      weightKg: z.number().positive(),
      rackUnits: z.number().int().positive(),
    }),
  })
  .meta({
    title: "AmplifierSpec v1",
    description:
      "Datasheet de un amplificador/procesador (nodo pa) del catálogo. powerPerChannelW cruzado " +
      "con la impedancia del parlante conectado resuelve el electricalPowerW de la simulación.",
  });

export type AmplifierSpec = z.infer<typeof amplifierSpecSchema>;
