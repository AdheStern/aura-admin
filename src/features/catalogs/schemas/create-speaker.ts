// src/features/catalogs/schemas/create-speaker.ts

import { z } from "zod";

export const createSpeakerSchema = z.object({
  brand: z.string().trim().min(1, "La marca es obligatoria").max(120),
  model: z.string().trim().min(1, "El modelo es obligatorio").max(120),
  specJson: z.string().min(1, "El datasheet (JSON) es obligatorio"),
});

export type CreateSpeakerInput = z.infer<typeof createSpeakerSchema>;
