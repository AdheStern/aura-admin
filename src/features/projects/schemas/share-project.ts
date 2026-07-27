// src/features/projects/schemas/share-project.ts — solo EDITOR|VIEWER: OWNER no se reasigna aquí

import { z } from "zod";
import { projectIdSchema } from "@/features/projects/schemas/ids";

export const shareProjectSchema = z.object({
  projectId: projectIdSchema,
  email: z.email("Ingresa un email válido"),
  role: z.enum(["EDITOR", "VIEWER"]),
});

export type ShareProjectInput = z.infer<typeof shareProjectSchema>;
