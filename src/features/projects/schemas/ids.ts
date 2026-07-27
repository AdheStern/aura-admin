// src/features/projects/schemas/ids.ts — validación de identificadores

import { z } from "zod";

// Project/Scene se generan con Prisma @default(cuid()) → cuid real.
export const projectIdSchema = z.cuid("ID de proyecto inválido");

// User.id lo genera Better Auth con su propio generador (32 chars a-z/A-Z/0-9), NO es un
// cuid — validarlo con z.cuid() rechazaría usuarios reales la mayoría de las veces.
export const userIdSchema = z.string().min(1, "ID de usuario inválido");
