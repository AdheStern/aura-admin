// src/features/room-editor/schemas/room-document.ts — el documento que se serializa a Scene.room.
// Contrato interno de la app; al motor va lo que produce model/to-room-geometry.ts.
//
// Es RoomGeometry v1 con las restricciones de COMPLETITUD relajadas, y no el contrato mismo, porque
// el autosave persiste mientras el usuario dibuja: un footprint de dos vértices, sin audiencia
// todavía y sin materiales asignados no satisface el contrato y sin embargo es exactamente lo que
// hay que guardar. Lo que el contrato exige y aquí se relaja: mínimo de vértices, mínimo de una
// zona de audiencia y materialId obligatorio (aquí null = "el material por defecto, con aviso").
// Lo que se añade: un id por zona, que el editor necesita para seleccionar y el contrato no lleva.
//
// Estricto igual que el contrato: un campo de más significa que se guardó estado de la herramienta
// (arrastre a medias, selección) en vez del documento, y eso es un bug que se corta en el parseo.

import { z } from "zod";
import {
  CEILING_SURFACE_ID,
  FLOOR_SURFACE_ID,
} from "@/features/room-editor/schemas/surface-ids";

export const point2dSchema = z.tuple([z.number(), z.number()]);
export const polygon2dSchema = z.array(point2dSchema);

export type Point2d = z.infer<typeof point2dSchema>;
export type Polygon2d = z.infer<typeof polygon2dSchema>;

/** null = sin asignar. El editor 3D (Fase 4) es quien reparte materiales; el 2D los deja vacíos. */
const materialIdSchema = z.string().min(1).nullable();

export const roomSurfaceSchema = z.strictObject({
  id: z.string().min(1),
  type: z.enum(["wall", "floor", "ceiling"]),
  materialId: materialIdSchema,
});

export const roomObstacleSchema = z.discriminatedUnion("shape", [
  z.strictObject({
    id: z.string().min(1),
    type: z.literal("pillar"),
    shape: z.literal("rect"),
    at: point2dSchema,
    /** [ancho, profundidad] en metros. */
    size: z.tuple([z.number().positive(), z.number().positive()]),
    materialId: materialIdSchema,
  }),
  z.strictObject({
    id: z.string().min(1),
    type: z.literal("pillar"),
    shape: z.literal("circle"),
    at: point2dSchema,
    /** [radio] en metros. */
    size: z.tuple([z.number().positive()]),
    materialId: materialIdSchema,
  }),
]);

export const roomOpeningSchema = z.strictObject({
  id: z.string().min(1),
  type: z.enum(["window", "door"]),
  /** Id de un muro de `surfaces`, no su índice: tiene que sobrevivir a insertar vértices. */
  surfaceId: z.string().min(1),
  /** [x, y, ancho, alto] locales al muro: x desde su primer vértice, y desde el piso. */
  rect: z.tuple([
    z.number(),
    z.number(),
    z.number().positive(),
    z.number().positive(),
  ]),
  materialId: materialIdSchema,
});

/**
 * Dónde está y hacia dónde apunta una caja, en el marco del CONTRATO: `position` es [x, y, z] con
 * z = altura, igual que SimulationRequest.sources[] (three.js es Y-up y convierte al pintar).
 *
 * El grafo manda QUIÉN existe y el recinto DÓNDE está — la frontera que declara la cabecera de
 * resolve-flow-electrical.ts. De ahí que la clave sea `nodeId`, el id del nodo `speaker` del flujo:
 * aquí no se pueden crear parlantes, solo colocar los que el flujo ya trajo. Una colocación cuyo
 * nodo ya no existe es inerte (el editor y el compilador la ignoran), no un documento inválido.
 */
export const roomSpeakerSchema = z.strictObject({
  nodeId: z.string().min(1),
  position: z.tuple([z.number(), z.number(), z.number()]),
  /** yaw gira sobre la vertical (0° = mirando a +x), pitch inclina y roll gira sobre el eje de tiro. */
  rotationDeg: z.strictObject({
    yaw: z.number(),
    pitch: z.number(),
    roll: z.number(),
  }),
});

export const roomZoneSchema = z.strictObject({
  id: z.string().min(1),
  polygon: polygon2dSchema,
  earHeight: z.number().positive(),
  seated: z.boolean(),
});

export const roomStageSchema = z.strictObject({
  id: z.string().min(1),
  polygon: polygon2dSchema,
  elevation: z.number().nonnegative(),
});

export const roomDocumentSchema = z.strictObject({
  schemaVersion: z.literal("1"),
  units: z.literal("m"),
  footprint: z.strictObject({ vertices: polygon2dSchema }),
  // Solo "flat" en v1 (decisión de Fase 3, §14 del doc maestro): el contrato declara "gable" pero
  // sin parámetros de cumbrera, así que el motor lo trataría igual que plano. Se cierra aquí en vez
  // de con un check del validador para que el estado ni siquiera sea representable.
  height: z.strictObject({ type: z.literal("flat"), h: z.number().positive() }),
  surfaces: z.array(roomSurfaceSchema),
  obstacles: z.array(roomObstacleSchema),
  openings: z.array(roomOpeningSchema),
  zones: z.strictObject({
    stage: roomStageSchema.nullable(),
    audience: z.array(roomZoneSchema),
  }),
  // Con default porque llega en la Fase 4 sobre escenas ya guardadas (y sobre las cuatro fixtures):
  // exigirlo dejaría de parsear todo documento escrito antes de que los parlantes existieran.
  // Parcial a propósito — solo están los que el usuario movió; el resto los resuelve
  // model/speaker-placement.ts con una posición por defecto que no hace falta persistir.
  speakers: z.array(roomSpeakerSchema).default([]),
});

export type RoomDocument = z.infer<typeof roomDocumentSchema>;
export type RoomSurface = z.infer<typeof roomSurfaceSchema>;
export type RoomObstacle = z.infer<typeof roomObstacleSchema>;
export type RoomOpening = z.infer<typeof roomOpeningSchema>;
export type RoomZone = z.infer<typeof roomZoneSchema>;
export type RoomStage = z.infer<typeof roomStageSchema>;
export type RoomSpeaker = z.infer<typeof roomSpeakerSchema>;

/** Altura de una sala corriente. El usuario la ajusta; no hay valor "neutro" que no sea mentira. */
export const DEFAULT_ROOM_HEIGHT_M = 4;

// Piso y techo existen desde el minuto cero (toda sala los tiene y no se dibujan); los muros nacen
// con el footprint, así que una escena sin dibujar no tiene ninguno.
export const EMPTY_ROOM: RoomDocument = {
  schemaVersion: "1",
  units: "m",
  footprint: { vertices: [] },
  height: { type: "flat", h: DEFAULT_ROOM_HEIGHT_M },
  surfaces: [
    { id: FLOOR_SURFACE_ID, type: "floor", materialId: null },
    { id: CEILING_SURFACE_ID, type: "ceiling", materialId: null },
  ],
  obstacles: [],
  openings: [],
  zones: { stage: null, audience: [] },
  speakers: [],
};
