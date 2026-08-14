// src/features/simulation/actions/generate-panel-advice.ts — pide a la IA dónde colgar los paneles.
//
// El motor sí sabe decir CUÁNTA absorción falta —`add_absorption` lo hace, con sus metros cuadrados—
// pero no dónde ponerla: sus reglas trabajan sobre áreas de superficie, no sobre posiciones en un
// muro. Esta acción cubre esa última milla, que es criterio y se rotula como tal.
//
// Nunca escribe en el recinto. Un panel propuesto por un modelo no es una abertura del documento, y
// crearlo como tal lo volvería indistinguible de lo que el usuario dibujó.

"use server";

import { revalidatePath } from "next/cache";
import { resolveLlmConfig } from "@/features/settings/queries/resolve-llm-config";
import { buildPanelContext } from "@/features/simulation/model/panel-context";
import { placePanel } from "@/features/simulation/model/panel-placement";
import { buildPanelPrompt } from "@/features/simulation/model/panel-prompt";
import type { StoredPanelAdvice } from "@/features/simulation/queries/get-panel-advice";
import { resolvePanelInputs } from "@/features/simulation/queries/resolve-panel-inputs";
import { saveAdvice } from "@/features/simulation/queries/save-advice";
import { simulationIdSchema } from "@/features/simulation/schemas/ids";
import {
  panelAdviceSchema,
  parsePanelAdvice,
} from "@/features/simulation/schemas/panel-advice";
import { complete, reasonSuffix } from "@/lib/llm-client";
import { modelOf } from "@/lib/llm-providers";
import { toProviderJsonSchema } from "@/lib/provider-json-schema";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

/** Dos bastan para enseñar el criterio; el resto sobra en un plano y no se leería. */
const KEEP = 2;

const NOT_READY: Record<string, string> = {
  not_found: "La simulación ya no existe.",
  not_completed: "Esta simulación no llegó a completarse.",
  no_room: "Esta simulación no guardó una planta con la que trabajar.",
};

export async function generatePanelAdvice(
  simulationId: string,
): Promise<ActionResult<StoredPanelAdvice>> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsedId = simulationIdSchema.safeParse(simulationId);
  if (!parsedId.success) return fail("Simulación inválida");

  const inputs = await resolvePanelInputs(activeUser.data.id, parsedId.data);
  if (!inputs.ok)
    return fail(NOT_READY[inputs.reason] ?? "No se puede pedir consejo.");

  const llm = await resolveLlmConfig(activeUser.data.id);
  if (!llm) {
    return fail(
      "No hay clave de IA configurada. Añádela en Ajustes para pedir el tratamiento.",
    );
  }

  const { request, view, sceneName, projectId, sceneId } = inputs.data;
  const prompt = buildPanelPrompt({
    sceneName,
    context: buildPanelContext({
      room: request.room,
      materials: request.materials,
      sources: request.sources,
      view,
    }),
  });

  const completion = await complete(
    { provider: llm.provider, apiKey: llm.apiKey },
    prompt,
    toProviderJsonSchema(panelAdviceSchema),
  );
  if (!completion.ok) return fail(completion.message);

  const parsed = parsePanelAdvice(completion.text);
  if (!parsed.ok) {
    return fail(
      `La IA respondió algo que no se puede usar${reasonSuffix(completion.finishReason)}. ${parsed.message}`,
    );
  }

  const footprint = request.room.footprint.vertices;
  // Un panel en un muro que no existe, o que no cabe ni recortado, no llega a guardarse: dibujarlo
  // exigiría inventarle un sitio, y un plano con un panel inventado es peor que uno con uno menos.
  const panels = parsed.data.panels
    .filter((panel) => placePanel(footprint, panel) !== null)
    .slice(0, KEEP);
  if (panels.length === 0) {
    return fail(
      "La IA colocó los paneles en muros que no existen en esta planta. Vuelve a intentarlo.",
    );
  }

  const stored: StoredPanelAdvice = {
    advice: { ...parsed.data, panels },
    footprint,
    roomHeightM: request.room.height.h,
    provider: llm.provider,
    model: modelOf(llm.provider),
    generatedAt: new Date().toISOString(),
  };
  await saveAdvice(parsedId.data, "PANEL_ADVICE", stored, {
    panels: panels.length,
    provider: stored.provider,
    model: stored.model,
    generatedAt: stored.generatedAt,
  });

  revalidatePath(
    `/projects/${projectId}/scenes/${sceneId}/results/${parsedId.data}`,
  );
  return { ok: true, data: stored };
}

function fail(message: string): ActionResult<StoredPanelAdvice> {
  return { ok: false, error: { code: "VALIDATION_ERROR", message } };
}
