// src/features/catalogs/schemas/equipment.ts — entrada de formulario común a los cuatro catálogos
// de equipo (parlante, micrófono, consola, amplificador). Todos se identifican por marca+modelo y
// editan su datasheet como JSON, así que comparten un solo schema en vez de cuatro copias.
// Materiales no entra aquí: se identifica por el name de su propio spec, no por marca+modelo.

import { z } from "zod";
import { catalogIdSchema } from "@/features/catalogs/schemas/ids";

export const createEquipmentSchema = z.object({
  brand: z.string().trim().min(1, "La marca es obligatoria").max(120),
  model: z.string().trim().min(1, "El modelo es obligatorio").max(120),
  specJson: z.string().min(1, "El datasheet (JSON) es obligatorio"),
});

export const updateEquipmentSchema = createEquipmentSchema.extend({
  equipmentId: catalogIdSchema,
  verified: z.boolean(),
});

export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
