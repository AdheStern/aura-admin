// src/features/scenes/schemas.ts

import { z } from "zod";
import { projectIdSchema } from "@/features/projects/schemas/ids";

// Scene.id se genera con Prisma @default(cuid()) → cuid real.
export const sceneIdSchema = z.cuid("ID de escena inválido");

export const sceneStatusSchema = z.enum([
  "DRAFT",
  "FLOW_READY",
  "ROOM_READY",
  "SIMULATED",
]);
export type SceneStatus = z.infer<typeof sceneStatusSchema>;

export const createSceneSchema = z.object({
  projectId: projectIdSchema,
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120),
});
export type CreateSceneInput = z.infer<typeof createSceneSchema>;

export const renameSceneSchema = z.object({
  sceneId: sceneIdSchema,
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120),
});
export type RenameSceneInput = z.infer<typeof renameSceneSchema>;
