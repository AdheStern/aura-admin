// src/features/simulation/actions/apply-recommendation.ts — lleva una recomendación al recinto.
//
// Escribe en `Scene.room` como lo haría el editor, así que pasa por el mismo validador y la misma
// máquina de estado: aplicar una propuesta ES un cambio del recinto, y deja la escena en ROOM_READY
// con sus resultados marcados como desactualizados (§08). Saltarse eso dejaría una escena en
// SIMULATED cuyo mapa ya no describe dónde apunta esa caja.

"use server";

import { revalidatePath } from "next/cache";
import { requireProjectRole } from "@/features/projects/queries/require-project-role";
import { listRoomMaterialOptions } from "@/features/room-editor/queries/list-room-material-options";
import { parseRoom } from "@/features/room-editor/schemas/parse-room";
import { nextSceneStatusFromRoom } from "@/features/room-editor/validation/scene-status";
import { validateRoom } from "@/features/room-editor/validation/validate-room";
import type { SceneStatus } from "@/features/scenes/schemas";
import { applySpeakerOrientation } from "@/features/simulation/model/apply-speaker-orientation";
import { resolveRepositionTarget } from "@/features/simulation/queries/resolve-reposition-target";
import { simulationIdSchema } from "@/features/simulation/schemas/ids";
import { db } from "@/lib/db";
import { asJson } from "@/lib/prisma-json";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function applyRecommendation(
  simulationId: string,
  recommendationId: string,
): Promise<ActionResult<{ status: SceneStatus }>> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsedId = simulationIdSchema.safeParse(simulationId);
  if (!parsedId.success) return fail("Simulación inválida");

  const lookup = await resolveRepositionTarget(parsedId.data, recommendationId);
  if (!lookup.ok) {
    return fail(
      lookup.reason === "not_found"
        ? "La simulación ya no existe."
        : "Esa recomendación ya no se puede aplicar a esta escena.",
    );
  }

  const { target } = lookup;
  const access = await requireProjectRole(
    activeUser.data.id,
    target.projectId,
    ["OWNER", "EDITOR"],
  );
  if (!access.ok) return access;

  const scene = await db.scene.findUniqueOrThrow({
    where: { id: target.sceneId },
    select: { room: true, status: true },
  });
  const document = parseRoom(scene.room);
  if (!document.ok) return fail("El recinto de la escena no se puede leer.");

  const next = applySpeakerOrientation(
    document.data,
    target.nodeId,
    target.proposed,
    target.simulated,
  );

  const validation = validateRoom(next, await listRoomMaterialOptions());
  const status = nextSceneStatusFromRoom(
    scene.status as SceneStatus,
    validation.isComplete,
  );

  await db.scene.update({
    where: { id: target.sceneId },
    data: { room: asJson(next), status },
  });

  revalidatePath(
    `/projects/${target.projectId}/scenes/${target.sceneId}`,
    "layout",
  );
  return { ok: true, data: { status } };
}

function fail(message: string): ActionResult<{ status: SceneStatus }> {
  return { ok: false, error: { code: "VALIDATION_ERROR", message } };
}
