// src/features/catalogs/schemas/update-speaker.ts

import { z } from "zod";
import { catalogSpeakerIdSchema } from "@/features/catalogs/schemas/ids";

export const updateSpeakerSchema = z.object({
  speakerId: catalogSpeakerIdSchema,
  brand: z.string().trim().min(1, "La marca es obligatoria").max(120),
  model: z.string().trim().min(1, "El modelo es obligatorio").max(120),
  specJson: z.string().min(1, "El datasheet (JSON) es obligatorio"),
  verified: z.boolean(),
});

export type UpdateSpeakerInput = z.infer<typeof updateSpeakerSchema>;
