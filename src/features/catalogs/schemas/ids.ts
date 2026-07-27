// src/features/catalogs/schemas/ids.ts — CatalogSpeaker/CatalogMaterial se generan con
// Prisma @default(cuid()) → cuid real (a diferencia de userId, ver features/projects/schemas/ids.ts).

import { z } from "zod";

export const catalogSpeakerIdSchema = z.cuid("ID de parlante inválido");
export const catalogMaterialIdSchema = z.cuid("ID de material inválido");
