// src/features/room-3d/actions/update-speaker-audio.ts — archivo único (Sección 5 del doc maestro).
//
// Nivel, polaridad y delay viven en el NODO del grafo (son datos de la escena, no del catálogo), y
// el editor 3D los edita junto a la posición porque es donde se afina un sistema. Para no duplicar
// el dato se parchea el grafo en su sitio en vez de copiarlo al recinto: un solo dueño, dos UIs.
//
// Parchea solo esos tres campos en vez de recibir el documento entero como saveSignalFlow: el 3D no
// tiene el grafo abierto para editarlo, y mandarlo completo desde una pantalla que no lo gobierna
// invitaría a que un cliente viejo pisara aristas que otro acaba de crear.
//
// NO recalcula el estado de la escena a propósito. La validación del flujo es topológica y de
// catálogo (ver validate-signal-flow.ts): ninguno de estos tres campos puede cambiar el veredicto,
// así que recalcularlo solo abriría una carrera con el autosave del recinto, que escribe la misma
// fila con su propio status.

"use server";

import { requireProjectRole } from "@/features/projects/queries/require-project-role";
import { sceneIdSchema } from "@/features/scenes/schemas";
import {
  type SpeakerAudio,
  speakerAudioSchema,
} from "@/features/signal-flow/schemas/node-data";
import { parseSignalFlow } from "@/features/signal-flow/schemas/signal-flow";
import { db } from "@/lib/db";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

export async function updateSpeakerAudio(
  sceneId: string,
  nodeId: string,
  audio: SpeakerAudio,
): Promise<ActionResult<null>> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsedId = sceneIdSchema.safeParse(sceneId);
  const parsedAudio = speakerAudioSchema.safeParse(audio);
  if (!parsedId.success || !parsedAudio.success) {
    return invalid("Ajustes del parlante inválidos");
  }

  const scene = await db.scene.findUnique({
    where: { id: parsedId.data },
    select: { projectId: true, signalFlow: true },
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

  const parsedFlow = parseSignalFlow(scene.signalFlow);
  if (!parsedFlow.ok)
    return invalid("El flujo de señal guardado no es legible");

  const nodes = parsedFlow.data.nodes.map((node) =>
    node.id === nodeId && node.data.kind === "speaker"
      ? { ...node, data: { ...node.data, ...parsedAudio.data } }
      : node,
  );
  if (nodes.every((node, at) => node === parsedFlow.data.nodes[at])) {
    return invalid("El parlante no está en el flujo de señal");
  }

  await db.scene.update({
    where: { id: parsedId.data },
    data: { signalFlow: { ...parsedFlow.data, nodes } },
  });
  return { ok: true, data: null };
}

function invalid(message: string): ActionResult<null> {
  return { ok: false, error: { code: "VALIDATION_ERROR", message } };
}
