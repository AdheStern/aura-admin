// src/features/catalogs/schemas/speaker-categories.ts — derivado del contrato, no duplicado a
// mano: si speaker-spec.schema.ts añade un kind nuevo, el filtro y las etiquetas lo siguen solos.

import { speakerSpecSchema } from "@/contracts/speaker-spec.schema";

export const SPEAKER_CATEGORIES = speakerSpecSchema.shape.kind.options;

export const SPEAKER_KIND_LABEL: Record<
  (typeof SPEAKER_CATEGORIES)[number],
  string
> = {
  point_source: "Punto de fuente",
  line_array_element: "Elemento de line array",
  subwoofer: "Subwoofer",
  monitor: "Monitor",
};
