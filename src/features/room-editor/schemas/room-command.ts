// src/features/room-editor/schemas/room-command.ts — el vocabulario del editor CAD (patrón
// Command, §9.1). Toda mutación del documento pasa por aquí: las herramientas emiten comandos y el
// historial los apila, nunca se toca el documento a mano.
//
// TRAMPA que fija el diseño: un comando tiene que ser DETERMINISTA. Rehacer es reejecutarlo, así
// que ninguno puede generar ids dentro (`crypto.randomUUID()` daría un id distinto en el rehacer y
// las aberturas quedarían apuntando al muro anterior). Por eso los comandos de alta traen la
// entidad ya construida —con su id— desde la herramienta, y los de baja identifican por id.
//
// Tres verbos por familia de entidad (insert/remove/replace) en vez de un comando por gesto:
// mover y redimensionar un pilar son el mismo `replaceObstacle` con la entidad completa, que evita
// que el payload tenga que hablar de tuplas de tamaño 1 o 2 según la forma.

import { z } from "zod";
import {
  point2dSchema,
  polygon2dSchema,
  roomDocumentSchema,
  roomObstacleSchema,
  roomOpeningSchema,
  roomStageSchema,
  roomSurfaceSchema,
  roomZoneSchema,
} from "@/features/room-editor/schemas/room-document";

const idSchema = z.string().min(1);
const indexSchema = z.number().int().nonnegative();

export const roomCommandSchema = z.discriminatedUnion("kind", [
  /** Footprint completo: cierre de la polilínea y herramienta de rectángulo. */
  z.strictObject({
    kind: z.literal("setFootprint"),
    vertices: polygon2dSchema,
  }),
  z.strictObject({
    kind: z.literal("moveVertex"),
    index: indexSchema,
    atM: point2dSchema,
  }),
  /** Parte la arista `index` (vértice index → index+1); el vértice nuevo queda en index+1. */
  z.strictObject({
    kind: z.literal("insertVertex"),
    index: indexSchema,
    atM: point2dSchema,
  }),
  z.strictObject({ kind: z.literal("removeVertex"), index: indexSchema }),

  // Interno: ninguna herramienta lo emite, solo aparece como inverso de los comandos que cambian
  // la topología del footprint. Insertar o quitar un vértice reordena los muros y puede llevarse
  // por delante las aberturas de un muro que desaparece; ningún parámetro pequeño reconstruye eso,
  // así que el inverso carga las tres listas afectadas. Es el "snapshot" más chico que revierte la
  // operación — el documento entero (zonas, pilares, altura) nunca se copia.
  z.strictObject({
    kind: z.literal("setShell"),
    vertices: polygon2dSchema,
    surfaces: z.array(roomSurfaceSchema),
    openings: z.array(roomOpeningSchema),
  }),

  z.strictObject({
    kind: z.literal("setHeight"),
    heightM: z.number().positive(),
  }),
  z.strictObject({
    kind: z.literal("setSurfaceMaterial"),
    surfaceId: idSchema,
    materialId: idSchema.nullable(),
  }),

  z.strictObject({
    kind: z.literal("insertObstacle"),
    index: indexSchema,
    obstacle: roomObstacleSchema,
  }),
  z.strictObject({ kind: z.literal("removeObstacle"), id: idSchema }),
  z.strictObject({
    kind: z.literal("replaceObstacle"),
    obstacle: roomObstacleSchema,
  }),

  z.strictObject({
    kind: z.literal("insertOpening"),
    index: indexSchema,
    opening: roomOpeningSchema,
  }),
  z.strictObject({ kind: z.literal("removeOpening"), id: idSchema }),
  z.strictObject({
    kind: z.literal("replaceOpening"),
    opening: roomOpeningSchema,
  }),

  z.strictObject({
    kind: z.literal("insertAudienceZone"),
    index: indexSchema,
    zone: roomZoneSchema,
  }),
  z.strictObject({ kind: z.literal("removeAudienceZone"), id: idSchema }),
  z.strictObject({
    kind: z.literal("replaceAudienceZone"),
    zone: roomZoneSchema,
  }),

  /** null borra el escenario: es único, así que no necesita insert/remove propios. */
  z.strictObject({
    kind: z.literal("setStage"),
    stage: roomStageSchema.nullable(),
  }),

  /** Importar JSON (Tarea 3): reemplaza el documento entero. Es su propio inverso — deshacer un
   *  import es "reemplazar de vuelta" por el documento anterior, no requiere un comando aparte. */
  z.strictObject({
    kind: z.literal("replaceDocument"),
    document: roomDocumentSchema,
  }),
]);

export type RoomCommand = z.infer<typeof roomCommandSchema>;
export type RoomCommandKind = RoomCommand["kind"];
export type RoomCommandOf<K extends RoomCommandKind> = Extract<
  RoomCommand,
  { kind: K }
>;
