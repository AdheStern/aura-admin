// src/features/simulation/actions/enqueue-simulation.ts — encola una simulación en el motor.
//
// Las filas se crean ANTES de hablar con el motor: el 202 puede tardar, y si el proceso muriera
// entre el POST y el INSERT llegaría un callback para un job que no existe. Al revés solo cuesta
// una fila en FAILED, que es exactamente lo que hay que enseñar.
//
// El motor solo confirma que el payload es válido y que el job quedó encolado. Lo que pase después
// —incluido un GEOMETRY_INVALID que solo aparece al construir la sala— llega por callback.

"use server";

import { randomUUID } from "node:crypto";
import { requireProjectRole } from "@/features/projects/queries/require-project-role";
import { getSceneWithRole } from "@/features/scenes/queries";
import { sceneIdSchema } from "@/features/scenes/schemas";
import { resolveLlmConfig } from "@/features/settings/queries/resolve-llm-config";
import { requestHash } from "@/features/simulation/model/request-hash";
import { compileSceneRequest } from "@/features/simulation/queries/compile-scene-request";
import { db } from "@/lib/db";
import { EngineSubmitError, getEngineClient } from "@/lib/engine-client";
import { logger } from "@/lib/logger";
import { asJson } from "@/lib/prisma-json";
import { reportError } from "@/lib/report-error";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function enqueueSimulation(
  sceneId: string,
): Promise<ActionResult<{ simulationId: string }>> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsedId = sceneIdSchema.safeParse(sceneId);
  if (!parsedId.success) {
    return invalid("Escena inválida");
  }

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

  // Los ids se generan aquí y no con @default(cuid()) porque el compilador los necesita dentro del
  // payload antes de que exista la fila, y es puro por diseño.
  const ids = { jobId: randomUUID(), simulationId: randomUUID() };
  const compiled = await compileSceneRequest(scene, ids);
  if (!compiled.ok) return invalid(compiled.message);

  await db.simulation.create({
    data: {
      id: ids.simulationId,
      sceneId: scene.id,
      createdById: activeUser.data.id,
      requestHash: requestHash(compiled.request),
      config: asJson(compiled.request.config),
      request: asJson(compiled.request),
      job: { create: { id: ids.jobId } },
    },
  });

  try {
    // La clave se añade AQUÍ y no antes: lo que se guardó arriba —`request` y `requestHash`— no la
    // lleva, porque `request` es texto plano en la BD y el hash se compara con la escena de hoy
    // para saber si los resultados están desactualizados. Con la clave dentro, guardaríamos un
    // secreto en claro y cambiarla invalidaría resultados que siguen siendo buenos.
    const llm = await resolveLlmConfig(activeUser.data.id);
    await getEngineClient().submitSimulation({ ...compiled.request, llm });
    // El jobId es el correlation id de los dos lados (§10): con esta línea y la del callback se
    // sigue un job entero aunque el cálculo haya pasado por otro proceso.
    logger.info("simulación encolada", { jobId: ids.jobId, sceneId: scene.id });
  } catch (error) {
    // Sin el request dentro: lleva la API key del usuario y no tiene por qué acercarse a un log.
    reportError(error, { jobId: ids.jobId, sceneId: scene.id });
    await markSubmitFailed(ids.jobId, error);
    return invalid(
      error instanceof EngineSubmitError
        ? error.message
        : "El motor no aceptó la simulación.",
    );
  }

  return { ok: true, data: { simulationId: ids.simulationId } };
}

function invalid(message: string): ActionResult<{ simulationId: string }> {
  return { ok: false, error: { code: "VALIDATION_ERROR", message } };
}

async function markSubmitFailed(jobId: string, error: unknown): Promise<void> {
  const jobError =
    error instanceof EngineSubmitError
      ? error.toJobError()
      : { code: "ENGINE_FAILURE" as const, message: String(error) };

  await db.simulationJob.update({
    where: { id: jobId },
    data: { status: "FAILED", error: asJson(jobError), finishedAt: new Date() },
  });
}
