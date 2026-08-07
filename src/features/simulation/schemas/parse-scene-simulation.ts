// src/features/simulation/schemas/parse-scene-simulation.ts — lectura de la columna
// Scene.simulation. A diferencia de parseRoom no hace falta el caso especial del `{}` de Prisma:
// todos los campos del schema tienen default, así que el objeto vacío YA parsea a la configuración
// por defecto. Una columna ilegible sí se distingue de una vacía, igual que en el recinto.

import {
  type SceneSimulation,
  sceneSimulationSchema,
} from "@/features/simulation/schemas/scene-simulation";

export type ParseSceneSimulationResult =
  | { ok: true; data: SceneSimulation }
  | { ok: false; message: string };

export function parseSceneSimulation(raw: unknown): ParseSceneSimulationResult {
  const parsed = sceneSimulationSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join(".");
    return {
      ok: false,
      message: path
        ? `${path}: ${issue.message}`
        : (issue?.message ?? "Configuración de simulación inválida"),
    };
  }
  return { ok: true, data: parsed.data };
}
