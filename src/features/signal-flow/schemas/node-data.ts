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

const sourceNodeDataSchema = z.strictObject({
  kind: z.literal("source"),
  catalogItemId: catalogItemIdSchema,
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

// Los tres ajustes del parlante viajan tal cual al SimulationRequest (Sección 07): son datos de la
// escena, no del catálogo — la misma caja se usa a distinto nivel en dos escenas del mismo proyecto.
const speakerNodeDataSchema = z.strictObject({
  kind: z.literal("speaker"),
  catalogItemId: catalogItemIdSchema,
  /** Trim relativo aplicado sobre el nivel resuelto por la cadena eléctrica. */
  levelDb: z.number().min(-60).max(12).default(0),
  /** Inversión de polaridad (±180°): la suma compleja del motor la usa para detectar cancelaciones. */
  polarityInverted: z.boolean().default(false),
  /** Retardo de alineación. El máximo real lo limita el procesador; aquí solo se acota a lo sano. */
  delayMs: z.number().min(0).max(1000).default(0),
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
