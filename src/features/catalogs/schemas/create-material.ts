// src/features/catalogs/schemas/create-material.ts

import { z } from "zod";

export const createMaterialSchema = z.object({
  specJson: z.string().min(1, "El datasheet (JSON) es obligatorio"),
});

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
