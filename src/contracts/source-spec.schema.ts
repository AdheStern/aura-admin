// src/contracts/source-spec.schema.ts — contrato v1 de SourceSpec (Sección 4.2 del doc maestro)
// Fuente de verdad TS de source-spec.schema.json, la copia espejo que comparte con aura-engine.
// Objetos laxos a propósito: regla (3) de ingesta — los campos desconocidos se preservan
// pero se ignoran, para que un datasheet más rico que el schema no sea rechazado.
//
// Reparto con el motor: la Sección 5.1 dice que "cada nodo referencia un ítem de catálogo" y a la
// vez que el nodo `source` saca su espectro de una "tabla interna". Las dos cosas son ciertas y
// describen mitades distintas. Este contrato es la mitad de la app: qué fuentes existen, cómo se
// llaman, en qué rango tocan y cuánta energía acústica entregan — lo que el editor de flujo
// necesita para pintar y describir el nodo. El espectro por banda sigue viviendo en
// aura-engine/app/core/acoustics_tables.py, y lo que cruza al motor es la etiqueta programSpectrum.
//
// Por eso NO se declara programSpectrum aquí: el doc solo publica el valor "live_band" y no define
// el enum por instrumento; resolver fuente→espectro es tarea de Fase 2 ("espectros de programa por
// fuente"). Un campo v1 con claves inventadas sería peor que su ausencia.

import { z } from "zod";
import { rangeHzSchema } from "./frequency-response";

export const sourceSpecSchema = z
  .looseObject({
    schemaVersion: z.literal("1"),
    /** Familia del instrumento: alimenta la columna category y el filtro del catálogo. */
    kind: z.enum(["percussion", "strings", "keys", "vocals"]),
    name: z.string().min(1),

    /** Rango de las fundamentales, no de todo el contenido: los armónicos suben mucho más. */
    fundamentalRangeHz: rangeHzSchema,

    /** Descripción del contenido armónico y de dónde vive el ataque, en prosa. */
    harmonics: z.string().min(1),

    /** Clase de energía acústica. Ver referenceLevelDb para el porqué de que sea cualitativa. */
    acousticPower: z.enum(["low", "medium", "medium_high", "high"]),

    /** Si llega al sistema por amplificador propio (guitarra eléctrica, teclados) o al aire. */
    amplified: z.boolean(),

    notes: z.string().optional(),

    // El doc pide "nivel de referencia" para el nodo source pero no publica ni un valor, y las
    // tablas de curaduría clasifican la emisión de forma cualitativa. Se deja opcional en vez de
    // inventar dB por instrumento; Fase 2, al construir la tabla de espectros, podrá fijarlos.
    referenceLevelDb: z.number().optional(),
  })
  .meta({
    title: "SourceSpec v1",
    description:
      "Fuente sonora del catálogo (instrumento o voz) para el nodo source del flujo de señal. " +
      "Describe qué toca y con cuánta energía; el espectro por banda vive en la tabla del motor.",
  });

export type SourceSpec = z.infer<typeof sourceSpecSchema>;
