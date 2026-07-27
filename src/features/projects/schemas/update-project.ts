// src/features/projects/schemas/update-project.ts

import { z } from "zod";
import { projectIdSchema } from "@/features/projects/schemas/ids";

export const updateProjectSchema = z.object({
  projectId: projectIdSchema,
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(120),
  description: z.string().trim().max(500).optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
