// src/features/catalogs/schemas/update-material.ts

import { z } from "zod";
import { catalogMaterialIdSchema } from "@/features/catalogs/schemas/ids";

export const updateMaterialSchema = z.object({
  materialId: catalogMaterialIdSchema,
  specJson: z.string().min(1, "El datasheet (JSON) es obligatorio"),
  verified: z.boolean(),
});

export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
