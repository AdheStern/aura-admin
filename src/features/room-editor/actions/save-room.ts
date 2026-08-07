// src/features/room-editor/actions/save-room.ts — archivo único (Sección 5 del doc maestro).
//
// Autoritativa a propósito, igual que saveSignalFlow: una Server Action es un endpoint invocable
// directo, así que revalida TODO de nuevo con el catálogo de materiales (no confía en el snapshot
// que trae el cliente) y devuelve su propio veredicto — el store del editor reemplaza su validación
// optimista con este resultado tras cada guardado.

"use server";

import { revalidatePath } from "next/cache";
import { requireProjectRole } from "@/features/projects/queries/require-project-role";
import { listRoomMaterialOptions } from "@/features/room-editor/queries/list-room-material-options";
import {
  type RoomDocument,
  roomDocumentSchema,
} from "@/features/room-editor/schemas/room-document";
import { nextSceneStatusFromRoom } from "@/features/room-editor/validation/scene-status";
import {
  type RoomValidation,
  validateRoom,
} from "@/features/room-editor/validation/validate-room";
import { type SceneStatus, sceneIdSchema } from "@/features/scenes/schemas";
import { db } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function saveRoom(
  sceneId: string,
  document: RoomDocument,
): Promise<ActionResult<{ status: SceneStatus } & RoomValidation>> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsedId = sceneIdSchema.safeParse(sceneId);
  const parsedDocument = roomDocumentSchema.safeParse(document);
  if (!parsedId.success || !parsedDocument.success) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Geometría del recinto inválida",
      },
    };
  }

  const scene = await db.scene.findUnique({
    where: { id: parsedId.data },
    select: { projectId: true, status: true },
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

  const catalog = await listRoomMaterialOptions();
  const validation = validateRoom(parsedDocument.data, catalog);
  const status = nextSceneStatusFromRoom(
    scene.status as SceneStatus,
    validation.isComplete,
  );

  await db.scene.update({
    where: { id: parsedId.data },
    data: { room: parsedDocument.data, status },
  });

  revalidatePath(`/projects/${scene.projectId}/scenes/${parsedId.data}/room`);
  return { ok: true, data: { status, ...validation } };
}
