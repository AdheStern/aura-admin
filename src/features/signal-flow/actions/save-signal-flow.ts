// src/features/signal-flow/actions/save-signal-flow.ts — archivo único (Sección 5 del doc maestro)
//
// Autoritativa a propósito: una Server Action es un endpoint invocable directo, así que revalida
// TODO de nuevo con resolveFlowCatalog (no confía en el snapshot que trae el cliente) y devuelve su
// propio veredicto — el store del editor reemplaza su validación optimista con este resultado tras
// cada guardado, igual que ya hacen otras actions de escena con requireProjectRole.

"use server";

import { revalidatePath } from "next/cache";
import { requireProjectRole } from "@/features/projects/queries/require-project-role";
import { type SceneStatus, sceneIdSchema } from "@/features/scenes/schemas";
import { hydrateFlow } from "@/features/signal-flow/model/resolved-flow";
import { resolveFlowCatalog } from "@/features/signal-flow/queries/resolve-flow-catalog";
import {
  type SignalFlowDocument,
  signalFlowDocumentSchema,
} from "@/features/signal-flow/schemas/signal-flow";
import { nextSceneStatus } from "@/features/signal-flow/validation/scene-status";
import {
  type SignalFlowValidation,
  validateSignalFlow,
} from "@/features/signal-flow/validation/validate-signal-flow";
import { db } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function saveSignalFlow(
  sceneId: string,
  document: SignalFlowDocument,
): Promise<ActionResult<{ status: SceneStatus } & SignalFlowValidation>> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsedId = sceneIdSchema.safeParse(sceneId);
  const parsedDocument = signalFlowDocumentSchema.safeParse(document);
  if (!parsedId.success || !parsedDocument.success) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Flujo de señal inválido" },
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

  const snapshot = await resolveFlowCatalog(parsedDocument.data);
  const resolved = hydrateFlow(parsedDocument.data, snapshot);
  const validation = validateSignalFlow(resolved);
  const status = nextSceneStatus(
    scene.status as SceneStatus,
    validation.isComplete,
  );

  await db.scene.update({
    where: { id: parsedId.data },
    data: { signalFlow: parsedDocument.data, status },
  });

  revalidatePath(`/projects/${scene.projectId}/scenes/${parsedId.data}/flow`);
  return { ok: true, data: { status, ...validation } };
}
