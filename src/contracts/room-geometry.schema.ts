// src/contracts/room-geometry.schema.ts — contrato v1 de RoomGeometry (Secciones 4.2 y 5.2)
// Fuente de verdad TS de room-geometry.schema.json, la copia espejo que comparte con aura-engine.
// Estricto (no laxo como los catálogos): un campo de más aquí es un error del editor, y en
// geometría un error silencioso se paga con una simulación entera mal calculada.
//
// CONVENCIÓN MURO↔ARISTA (normativa, sin representación en el JSON Schema): la k-ésima superficie
// de tipo "wall" dentro de `surfaces` es la arista k del footprint, la que va del vértice k al k+1
// (y la última, del último vértice al primero). El id del muro es opaco: quien reparta materiales
// —RoomBuilder incluido— debe usar el ORDEN, no interpretar el nombre. De ahí cuelga el marco local
// de las aberturas, descrito en `openings.rect`.
// Sin esta convención el reparto de materiales solo funcionaría en plantas rectangulares con muros
// nombrados por punto cardinal, que es lo que hace CANON-01 y no generaliza a un polígono cualquiera.

import { z } from "zod";

const point2dSchema = z.tuple([z.number(), z.number()]);

/** Polígono en planta, metros. El cierre es implícito: el último vértice une con el primero. */
const polygon2dSchema = z.array(point2dSchema).min(3);

const surfaceSchema = z.strictObject({
  id: z.string().min(1),
  type: z.enum(["wall", "floor", "ceiling"]),
  materialId: z.string().min(1),
});

// Los pilares no se restan de la malla en v1: se aproximan como absorción/dispersión
// adicional + sombra del rayo directo, y el resultado lo declara en meta.validity.warnings.
const obstacleSchema = z.discriminatedUnion("shape", [
  z.strictObject({
    id: z.string().min(1),
    type: z.literal("pillar"),
    shape: z.literal("rect"),
    /** Centro del pilar en planta. */
    at: point2dSchema,
    /** [ancho, profundidad] en metros. */
    size: z.tuple([z.number().positive(), z.number().positive()]),
    materialId: z.string().min(1),
  }),
  z.strictObject({
    id: z.string().min(1),
    type: z.literal("pillar"),
    shape: z.literal("circle"),
    at: point2dSchema,
    /** [radio] en metros. */
    size: z.tuple([z.number().positive()]),
    materialId: z.string().min(1),
  }),
]);

// Las aberturas no agujerean la malla en v1 (KISS): solo cambian el material de esa área.
const openingSchema = z.strictObject({
  id: z.string().min(1),
  type: z.enum(["window", "door"]),
  surfaceId: z.string().min(1),
  /**
   * [x, y, ancho, alto] en coordenadas locales del muro, metros: `x` se mide desde el PRIMER
   * vértice de su arista (el vértice k) avanzando hacia el segundo, e `y` desde el piso hacia
   * arriba. El muro se identifica por `surfaceId`, y su arista por la posición de esa superficie
   * entre las de tipo "wall" (convención de la cabecera).
   */
  rect: z.tuple([
    z.number(),
    z.number(),
    z.number().positive(),
    z.number().positive(),
  ]),
  materialId: z.string().min(1),
});

export const roomGeometrySchema = z
  .strictObject({
    schemaVersion: z.literal("1"),
    units: z.literal("m"),

    /** Vértices en sentido antihorario (CCW). Permite plantas no rectangulares. */
    footprint: z.strictObject({
      vertices: polygon2dSchema,
    }),

    // v1 modela solo techo plano; "gable" queda declarado por el doc pero sin parámetros
    // propios todavía, así que hoy se comporta igual que "flat" (ver nota en el README de
    // contratos). Los perfiles de corte llegan en v2.
    height: z.strictObject({
      type: z.enum(["flat", "gable"]),
      h: z.number().positive(),
    }),

    /**
     * Lista parcial: las superficies sin entrada toman el material por defecto con aviso.
     * Las de tipo "wall" van en orden de arista del footprint (convención de la cabecera); piso y
     * techo pueden ir en cualquier posición porque no hay nada que ordenar en ellos.
     */
    surfaces: z.array(surfaceSchema),
    obstacles: z.array(obstacleSchema),
    openings: z.array(openingSchema),

    zones: z.strictObject({
      stage: z
        .strictObject({
          polygon: polygon2dSchema,
          elevation: z.number().nonnegative(),
        })
        .optional(),
      // Al menos una: sin zona de audiencia no hay grilla de escucha que calcular.
      audience: z
        .array(
          z.strictObject({
            polygon: polygon2dSchema,
            earHeight: z.number().positive(),
            seated: z.boolean(),
          }),
        )
        .min(1),
    }),
  })
  .meta({
    title: "RoomGeometry v1",
    description:
      "Documento geométrico del recinto: contrato central entre el editor 2D/3D y el motor. " +
      "Footprint extruido a una altura, materiales por superficie, obstáculos, aberturas y zonas.",
  });

export type RoomGeometry = z.infer<typeof roomGeometrySchema>;
