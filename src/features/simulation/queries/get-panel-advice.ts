// src/features/simulation/queries/get-panel-advice.ts — el tratamiento guardado de una simulación.
//
// Guarda además el FOOTPRINT sobre el que se propuso. No es redundante: el consejo dice "muro 2, a
// 3 m de la esquina", y eso solo significa algo contra una planta concreta. Si mañana alguien mueve
// un vértice de la escena, dibujar los paneles sobre la planta de hoy los pondría en otro sitio sin
// avisar. Congelándolo, el plano que se enseña es el mismo que vio el modelo.
//
// Se reparsea con zod en vez de confiar en la columna, igual que fromSimResults con los resultados
// del motor: una fila vieja debe dejar la sección con su botón de generar, no romper la página.
//
// No comprueba permisos: la vista de resultados ya pasó por resolveProjectAccess para llegar aquí.

import { z } from "zod";
import { point2dSchema } from "@/features/room-editor/schemas/room-document";
import { panelAdviceSchema } from "@/features/simulation/schemas/panel-advice";
import { db } from "@/lib/db";

export const storedPanelAdviceSchema = z.object({
  advice: panelAdviceSchema,
  /** La planta congelada contra la que se midieron las posiciones. */
  footprint: z.array(point2dSchema).min(3),
  roomHeightM: z.number().positive(),
  provider: z.string().min(1),
  model: z.string().min(1),
  generatedAt: z.string().min(1),
});

export type StoredPanelAdvice = z.infer<typeof storedPanelAdviceSchema>;

export async function getPanelAdvice(
  simulationId: string,
): Promise<StoredPanelAdvice | null> {
  const row = await db.simResult.findFirst({
    where: { simulationId, kind: "PANEL_ADVICE" },
    select: { payload: true },
    orderBy: { id: "desc" },
  });
  if (!row) return null;

  const parsed = storedPanelAdviceSchema.safeParse(row.payload);
  return parsed.success ? parsed.data : null;
}
