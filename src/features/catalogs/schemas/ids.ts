// src/features/catalogs/schemas/ids.ts — todas las filas de catálogo se generan con Prisma
// @default(cuid()) → cuid real (a diferencia de userId, ver features/projects/schemas/ids.ts).

import { z } from "zod";

export const catalogIdSchema = z.cuid("Identificador de catálogo inválido");
