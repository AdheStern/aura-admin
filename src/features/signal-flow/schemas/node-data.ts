// src/features/signal-flow/schemas/node-data.ts — la data de cada nodo del grafo, unión
// discriminada por `kind`. Es lo que se serializa dentro de Scene.signalFlow.
//
// Los nodos de equipo guardan SOLO la referencia al catálogo, nunca una copia del spec: el
// datasheet es de la fila de catálogo y copiarlo aquí crearía dos verdades que divergen en cuanto
// alguien corrige un valor. El precio es que validar el grafo exige resolver el catálogo antes
// (model/resolved-flow.ts) — a cambio, un parlante corregido en el catálogo corrige todas las
// escenas que lo usan.
//
// catalogItemId se llama igual en los cinco tipos de equipo, no catalogSpeakerId/catalogConsoleId:
// `kind` ya dice a qué catálogo apunta, y un nombre único deja que el registro de nodos resuelva
// kind→tabla en un solo sitio en vez de obligar a cada consumidor a repetir el switch.

import { z } from "zod";

/** Nodo de equipo recién soltado en el lienzo: el id es null hasta que el usuario elige ítem. */
const catalogItemIdSchema = z.cuid().nullable();

/**
 * Cómo sale la fuente hacia la consola.
 *
 * Es un dato de la ESCENA y no del catálogo: el mismo teclado va en estéreo a dos canales o
 * sumado a mono según cómo se monte, así que no es una propiedad del instrumento que pueda vivir
 * en SourceSpec. Al elegir un ítem de la familia `keys` el editor arranca en estéreo, que es lo
 * habitual en sintetizadores y pianos digitales; el resto arranca en mono.
 */
export const sourceOutputModeSchema = z.enum(["mono", "stereo"]);
export type SourceOutputMode = z.infer<typeof sourceOutputModeSchema>;

const sourceNodeDataSchema = z.strictObject({
  kind: z.literal("source"),
  catalogItemId: catalogItemIdSchema,
  // Default mono para que los grafos guardados antes de que esto existiera sigan parseando: sin
  // él, abrir una escena vieja fallaría al leer un campo que nunca se escribió.
  outputMode: sourceOutputModeSchema.default("mono"),
});

const microphoneNodeDataSchema = z.strictObject({
  kind: z.literal("microphone"),
  catalogItemId: catalogItemIdSchema,
});

const consoleNodeDataSchema = z.strictObject({
  kind: z.literal("console"),
  catalogItemId: catalogItemIdSchema,
});

const paNodeDataSchema = z.strictObject({
  kind: z.literal("pa"),
  catalogItemId: catalogItemIdSchema,
});

/**
 * Los tres ajustes del parlante que viajan tal cual al SimulationRequest (Sección 07): son datos de
 * la escena, no del catálogo — la misma caja se usa a distinto nivel en dos escenas del proyecto.
 *
 * Con forma propia porque el editor 3D también los edita (Fase 4): el gizmo ajusta dónde apunta la
 * caja y el mismo panel afina su nivel, así que la action que los parchea desde el recinto valida
 * contra ESTE schema en vez de reescribir los rangos y arriesgarse a que diverjan.
 */
export const speakerAudioSchema = z.strictObject({
  /** Trim relativo aplicado sobre el nivel resuelto por la cadena eléctrica. */
  levelDb: z.number().min(-60).max(12).default(0),
  /** Inversión de polaridad (±180°): la suma compleja del motor la usa para detectar cancelaciones. */
  polarityInverted: z.boolean().default(false),
  /** Retardo de alineación. El máximo real lo limita el procesador; aquí solo se acota a lo sano. */
  delayMs: z.number().min(0).max(1000).default(0),
});

export type SpeakerAudio = z.infer<typeof speakerAudioSchema>;

const speakerNodeDataSchema = z.strictObject({
  kind: z.literal("speaker"),
  catalogItemId: catalogItemIdSchema,
  ...speakerAudioSchema.shape,
});

// No referencia catálogo ni tiene datasheet: es el punto de entrada al editor de recinto, no un
// aparato (salvedad explícita del callout de la Sección 5.1).
const simulationNodeDataSchema = z.strictObject({
  kind: z.literal("simulation"),
});

export const flowNodeDataSchema = z.discriminatedUnion("kind", [
  sourceNodeDataSchema,
  microphoneNodeDataSchema,
  consoleNodeDataSchema,
  paNodeDataSchema,
  speakerNodeDataSchema,
  simulationNodeDataSchema,
]);

export type FlowNodeData = z.infer<typeof flowNodeDataSchema>;
export type SpeakerNodeData = z.infer<typeof speakerNodeDataSchema>;
export type SourceNodeData = z.infer<typeof sourceNodeDataSchema>;
