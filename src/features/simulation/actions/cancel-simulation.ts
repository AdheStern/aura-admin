// src/features/simulation/actions/cancel-simulation.ts — parar un job en curso.
//
// Cancelar es una PETICIÓN, no un hecho: el motor marca la intención y el job se detiene en su
// siguiente reporte de progreso, así que responde con el estado del momento, que puede seguir
// siendo RUNNING. Lo que decide qué escribe la app es ese estado, no el haberlo pedido:
//
//   · el motor lo daba por vivo (o ya no lo conoce) → se cierra como CANCELLED aquí, porque una
//     cancelación no genera callback y nadie más va a escribirlo;
//   · el motor dice que ya terminó → no se toca: el resultado llegó o está por llegar, y taparlo
//     con CANCELLED tiraría un cálculo bueno;
//   · no se pudo hablar con el motor → tampoco se toca. Dar por parado algo que sigue calculando
//     dejaría a la app mintiendo, y el cron de los 10 minutos lo cerrará si de verdad se perdió.

"use server";

import { revalidatePath } from "next/cache";
import { requireProjectRole } from "@/features/projects/queries/require-project-role";
import { getSceneWithRole } from "@/features/scenes/queries";
import { sceneIdSchema } from "@/features/scenes/schemas";
import { getLatestJob } from "@/features/simulation/queries/get-latest-job";
import { recordJobCancelled } from "@/features/simulation/queries/record-job-cancelled";
import { getEngineClient } from "@/lib/engine-client";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function cancelSimulation(
  sceneId: string,
): Promise<ActionResult<{ cancelled: boolean }>> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsedId = sceneIdSchema.safeParse(sceneId);
  if (!parsedId.success) return fail("Escena inválida");

  const scene = await getSceneWithRole(activeUser.data.id, parsedId.data);
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

  const job = await getLatestJob(scene.id);
  if (!job || (job.status !== "QUEUED" && job.status !== "RUNNING")) {
    return fail("No hay ninguna simulación en curso que cancelar.");
  }

  const outcome = await getEngineClient().cancelSimulation(job.jobId);
  if (!outcome.ok && outcome.reason === "unreachable") {
    return fail("No se pudo avisar al motor. La simulación sigue en marcha.");
  }

  if (
    outcome.ok &&
    (outcome.status === "COMPLETED" || outcome.status === "FAILED")
  ) {
    return fail("La simulación ya había terminado.");
  }

  const record = await recordJobCancelled(job.jobId);
  revalidatePath(`/projects/${scene.projectId}/scenes/${scene.id}`, "layout");
  return { ok: true, data: { cancelled: record === "cancelled" } };
}

function fail(message: string): ActionResult<{ cancelled: boolean }> {
  return { ok: false, error: { code: "VALIDATION_ERROR", message } };
}
