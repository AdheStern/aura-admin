// src/features/simulation/actions/save-scene-simulation.ts — archivo único (Sección 5).
//
// Autoritativa como sus hermanas: revalida el documento con el mismo schema del contrato que usa el
// compilador, así que lo que se persiste ya es un bloque de payload válido.
//
// No toca `status`. La máquina de escena (§08) no mira el ambiente ni la configuración para decidir
// ROOM_READY: se llega ahí con geometría, materiales y audiencia. La arista que sí existe —
// SIMULATED → ROOM_READY cuando un cambio invalida resultados vigentes— no tiene nada que degradar
// todavía, porque hasta la Fase 5 ninguna escena puede alcanzar SIMULATED.

"use server";

import { revalidatePath } from "next/cache";
import { requireProjectRole } from "@/features/projects/queries/require-project-role";
import { sceneIdSchema } from "@/features/scenes/schemas";
import {
  type SceneSimulation,
  sceneSimulationSchema,
} from "@/features/simulation/schemas/scene-simulation";
import { db } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function saveSceneSimulation(
  sceneId: string,
  simulation: SceneSimulation,
): Promise<ActionResult<null>> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsedId = sceneIdSchema.safeParse(sceneId);
  const parsed = sceneSimulationSchema.safeParse(simulation);
  if (!parsedId.success || !parsed.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Configuración de simulación inválida",
      },
    };
  }

  const scene = await db.scene.findUnique({
    where: { id: parsedId.data },
    select: { projectId: true },
  });
  if (!scene) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Escena no encontrada" },
    };
  }

  const access = await requireProjectRole(activeUser.data.id, scene.projectId, [
    "OWNER",
    "EDITOR",
  ]);
  if (!access.ok) return access;

  await db.scene.update({
    where: { id: parsedId.data },
    data: { simulation: parsed.data },
  });

  revalidatePath(
    `/projects/${scene.projectId}/scenes/${parsedId.data}/room/3d`,
  );
  return { ok: true, data: null };
}
