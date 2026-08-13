// src/features/simulation/queries/get-mix-advice.ts — el consejo guardado de una simulación.
//
// Se reparsea con `mixAdviceSchema` en vez de confiar en la columna, igual que fromSimResults hace
// con los resultados del motor: entre que se escribió y que se lee puede haber cambiado el schema,
// y una fila vieja debe dejar la sección vacía —con su botón de generar— y no romper la página.
//
// La fila guarda ADEMÁS quién lo escribió y cuándo. Sin eso, defender ante un tribunal de dónde
// sale un `ratio 3:1` es imposible: no basta con marcar la sección como "criterio", hay que poder
// decir qué modelo lo propuso y sobre qué corrida.
//
// No comprueba permisos: la vista de resultados ya pasó por resolveProjectAccess para llegar aquí.

import { z } from "zod";
import { mixAdviceSchema } from "@/features/simulation/schemas/mix-advice";
import { db } from "@/lib/db";

export const storedMixAdviceSchema = z.object({
  advice: mixAdviceSchema,
  provider: z.string().min(1),
  model: z.string().min(1),
  generatedAt: z.string().min(1),
});

export type StoredMixAdvice = z.infer<typeof storedMixAdviceSchema>;

export async function getMixAdvice(
  simulationId: string,
): Promise<StoredMixAdvice | null> {
  const row = await db.simResult.findFirst({
    where: { simulationId, kind: "MIX_ADVICE" },
    select: { payload: true },
    orderBy: { id: "desc" },
  });
  if (!row) return null;

  const parsed = storedMixAdviceSchema.safeParse(row.payload);
  return parsed.success ? parsed.data : null;
}
