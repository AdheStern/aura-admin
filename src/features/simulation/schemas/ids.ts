// src/features/simulation/schemas/ids.ts — la forma de los ids de simulación y de job.
//
// No son cuid como los del resto del dominio: los genera la action de encolado con randomUUID()
// porque el compilador del payload los necesita ANTES de que exista la fila, y es puro por diseño
// (ADR-03). El @default(cuid()) de Prisma solo cubriría filas creadas fuera de la app.

import { z } from "zod";

export const simulationIdSchema = z.uuid("ID de simulación inválido");

export const jobIdSchema = z.uuid("ID de job inválido");
