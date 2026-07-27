// src/contracts/room-geometry.schema.ts — contrato v1 de RoomGeometry (Sección 4.2/5.2 del doc maestro)
// Espejo TS del room-geometry.schema.json que vivirá en aura-engine/contracts.

import { z } from "zod";

const point2dSchema = z.tuple([z.number(), z.number()]);

export const roomGeometrySchema = z.object({
  schemaVersion: z.literal("1"),
  units: z.literal("m"),
  footprint: z.object({
    vertices: z.array(point2dSchema).min(3),
  }),
  height: z.object({
    type: z.enum(["flat", "gable"]),
    h: z.number().positive(),
  }),
  surfaces: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["wall", "floor", "ceiling"]),
      materialId: z.string(),
    }),
  ),
  obstacles: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["pillar"]),
      shape: z.enum(["rect", "circle"]),
      at: point2dSchema,
      size: z.array(z.number().positive()).min(1).max(2),
      materialId: z.string(),
    }),
  ),
  openings: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["window", "door"]),
      surfaceId: z.string(),
      rect: z.tuple([
        z.number(),
        z.number(),
        z.number().positive(),
        z.number().positive(),
      ]),
      materialId: z.string(),
    }),
  ),
  zones: z.object({
    stage: z
      .object({
        polygon: z.array(point2dSchema).min(3),
        elevation: z.number().nonnegative(),
      })
      .optional(),
    audience: z.array(
      z.object({
        polygon: z.array(point2dSchema).min(3),
        earHeight: z.number().positive(),
        seated: z.boolean(),
      }),
    ),
  }),
});

export type RoomGeometry = z.infer<typeof roomGeometrySchema>;
