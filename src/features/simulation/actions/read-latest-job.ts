// src/features/simulation/actions/read-latest-job.ts — el estado del job vigente, para el sondeo.
//
// Es lectura, pero va como action y con authz igual que las demás: una Server Action es un endpoint
// invocable directo, y "solo lee" no exime de comprobar quién lee.
//
// El doc maestro quiere Realtime de Supabase para esto. Un sondeo mientras el job vive es lo mismo
// visto desde la UI y no añade infraestructura; cambiarlo después no toca nada más que este hook.

"use server";

import { getSceneWithRole } from "@/features/scenes/queries";
import { sceneIdSchema } from "@/features/scenes/schemas";
import {
  getLatestJob,
  type LatestJob,
} from "@/features/simulation/queries/get-latest-job";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function readLatestJob(
  sceneId: string,
): Promise<ActionResult<LatestJob | null>> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsedId = sceneIdSchema.safeParse(sceneId);
  if (!parsedId.success) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Escena inválida" },
    };
  }

  // getSceneWithRole ya resuelve el acceso: cualquier rol puede MIRAR el progreso, solo
  // OWNER/EDITOR pueden encolar (eso lo exige enqueueSimulation por su cuenta).
  const scene = await getSceneWithRole(activeUser.data.id, parsedId.data);
  if (!scene) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Escena no encontrada" },
    };
  }

  return { ok: true, data: await getLatestJob(scene.id) };
}
