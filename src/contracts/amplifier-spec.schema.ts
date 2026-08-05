// src/contracts/amplifier-spec.schema.ts — contrato v1 de AmplifierSpec (Sección 4.2 del doc maestro)
// Fuente de verdad TS de amplifier-spec.schema.json, la copia espejo que comparte con aura-engine.
// Objetos laxos a propósito: regla (3) de ingesta — los campos desconocidos se preservan
// pero se ignoran, para que un datasheet más rico que el schema no sea rechazado.
//
// Unión discriminada por `kind`, no un objeto único, porque el nodo `pa` del flujo cubre dos
// aparatos que no comparten la misma física: el que amplifica (y cuya potencia por canal resuelve
// el electricalPowerW del SimulationRequest) y el gestor de altavoces, que solo procesa. Se modela
// como unión y no con powerPerChannelW opcional + refine porque z.toJSONSchema SÍ representa las
// uniones —emite oneOf— y en cambio descarta los refine en silencio: así la restricción sobrevive
// intacta a la copia al motor.
//
// Pendiente de Fase 2: las reglas de conexión del doc son lineales (console→pa→speaker) y no
// contemplan pa→pa, así que hoy no se puede encadenar un procesador ANTES de un amplificador.
// Al diseñar el grafo habrá que decidir si esa cadena se admite.

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

/** Lo que ambas variantes comparten: el nodo se dibuja igual, cambia lo que aporta a la física. */
const commonShape = {
  schemaVersion: z.literal("1"),

  io: z.looseObject({
    /** N handles de entrada del nodo. */
    inputChannels: z.number().int().positive(),
    /** M handles de salida: cada uno alimenta un parlante del grafo. */
    outputChannels: z.number().int().positive(),
  }),

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
};

/** Con etapa de potencia: es el único caso que alimenta la simulación. */
const poweredVariant = z.looseObject({
  ...commonShape,
  kind: z.enum(["amplifier", "amplifier_dsp"]),
  powerPerChannelW: powerPerChannelWSchema,
});

// Gestor de altavoces (dbx DriveRack, Behringer DCX…): EQ, crossover, limitador y alineación
// temporal, sin etapa de potencia. No declara powerPerChannelW porque no entrega vatios: un
// grafo que lo use necesita todavía un amplificador aguas abajo para que el parlante suene.
const processorVariant = z.looseObject({
  ...commonShape,
  kind: z.literal("processor"),
});

export const amplifierSpecSchema = z
  .discriminatedUnion("kind", [poweredVariant, processorVariant])
  .meta({
    title: "AmplifierSpec v1",
    description:
      "Datasheet de un amplificador o procesador (nodo pa) del catálogo. En las variantes con " +
      "potencia, powerPerChannelW cruzado con la impedancia del parlante conectado resuelve el " +
      "electricalPowerW de la simulación; la variante processor no aporta potencia.",
  });

export type AmplifierSpec = z.infer<typeof amplifierSpecSchema>;
