// src/features/catalogs/schemas/named-item.ts — entrada de formulario de los catálogos que se identifican por
// el `name` de su propio spec (materiales y fuentes), no por marca+modelo. Es el equivalente de
// equipment.ts para los otros dos tipos: solo el datasheet, porque el nombre sale de dentro del JSON.

import { z } from "zod";
import { catalogIdSchema } from "@/features/catalogs/schemas/ids";

export const createNamedItemSchema = z.object({
  specJson: z.string().min(1, "El datasheet (JSON) es obligatorio"),
});

export const updateNamedItemSchema = createNamedItemSchema.extend({
  itemId: catalogIdSchema,
  verified: z.boolean(),
});

export type CreateNamedItemInput = z.infer<typeof createNamedItemSchema>;
export type UpdateNamedItemInput = z.infer<typeof updateNamedItemSchema>;
