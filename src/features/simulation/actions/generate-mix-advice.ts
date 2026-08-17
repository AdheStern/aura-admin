// src/features/simulation/actions/generate-mix-advice.ts — pide a la IA el ajuste por instrumento.
//
// Es la ÚNICA capa que puede dar consejo por instrumento: el motor no los modela (sus `sources` son
// cajas acústicas), así que ninguna de las siete reglas puede hablar de la voz o del piano.
//
// Nunca escribe en la escena. Lo que devuelve es criterio de un modelo, no física, y confundirlo
// con una recomendación aplicable es exactamente lo que la vista tiene que evitar.

"use server";

import { revalidatePath } from "next/cache";
import { resolveLlmConfig } from "@/features/settings/queries/resolve-llm-config";
import { buildMixContext } from "@/features/simulation/model/mix-context";
import { buildMixPrompt } from "@/features/simulation/model/mix-prompt";
import type { StoredMixAdvice } from "@/features/simulation/queries/get-mix-advice";
import { resolveMixInputs } from "@/features/simulation/queries/resolve-mix-inputs";
import { saveAdvice } from "@/features/simulation/queries/save-advice";
import { simulationIdSchema } from "@/features/simulation/schemas/ids";
import {
  type MixAdvice,
  parseMixAdvice,
} from "@/features/simulation/schemas/mix-advice";
import { mixAdviceJsonSchema } from "@/features/simulation/schemas/mix-advice-json-schema";
import { complete, reasonSuffix } from "@/lib/llm-client";
import { modelOf } from "@/lib/llm-providers";
import { getActiveUser } from "@/lib/session";
import type { ActionResult } from "@/types/action-result";

const NOT_READY: Record<string, string> = {
  not_found: "La simulación ya no existe.",
  not_completed: "Esta simulación no llegó a completarse.",
  no_instruments:
    "El flujo de señal de la escena no tiene instrumentos con ítem de catálogo elegido.",
};

/**
 * Devuelve el consejo CON su procedencia y no a secas: quién lo escribió es parte del dato, no
 * decoración. Si la vista tuviera que reconstruir el nombre del modelo por su cuenta acabaría
 * enseñando uno equivocado justo en la pantalla que hay que poder defender.
 */
export async function generateMixAdvice(
  simulationId: string,
): Promise<ActionResult<StoredMixAdvice>> {
  const activeUser = await getActiveUser();
  if (!activeUser.ok) return activeUser;

  const parsedId = simulationIdSchema.safeParse(simulationId);
  if (!parsedId.success) return fail("Simulación inválida");

  const inputs = await resolveMixInputs(activeUser.data.id, parsedId.data);
  if (!inputs.ok)
    return fail(NOT_READY[inputs.reason] ?? "No se puede pedir consejo.");

  const llm = await resolveLlmConfig(activeUser.data.id);
  if (!llm) {
    return fail(
      "No hay clave de IA configurada. Añádela en Ajustes para pedir el ajuste de mezcla.",
    );
  }

  const { sceneName, view, instruments, projectId, sceneId } = inputs.data;
  const prompt = buildMixPrompt({
    sceneName,
    context: buildMixContext(view),
    instruments,
  });

  const completion = await complete(
    { provider: llm.provider, apiKey: llm.apiKey },
    prompt,
    mixAdviceJsonSchema(),
  );
  if (!completion.ok) return fail(completion.message);

  const parsed = parseMixAdvice(completion.text);
  if (!parsed.ok) {
    // El motivo de parada va en el mensaje: distingue "se quedó sin presupuesto" de "contestó otra
    // cosa", y sin él las dos se leen igual de inútiles desde la pantalla.
    return fail(
      `La IA respondió algo que no se puede usar${reasonSuffix(completion.finishReason)}. ${parsed.message}`,
    );
  }

  // El modelo inventa instrumentos que no están en el grafo. Se descartan aquí y no en la vista:
  // un canal que no existe en la escena no debe llegar a guardarse ni a pintarse.
  const known = new Set(instruments.map((item) => item.nodeId));
  const advice: MixAdvice = {
    ...parsed.data,
    instruments: parsed.data.instruments.filter((item) =>
      known.has(item.instrumentId),
    ),
  };
  if (advice.instruments.length === 0) {
    return fail(
      "La IA no devolvió ningún instrumento de esta escena. Vuelve a intentarlo.",
    );
  }

  const stored: StoredMixAdvice = {
    advice,
    provider: llm.provider,
    model: modelOf(llm.provider),
    generatedAt: new Date().toISOString(),
  };
  await saveAdvice(parsedId.data, "MIX_ADVICE", stored, {
    instruments: advice.instruments.length,
    provider: stored.provider,
    model: stored.model,
    generatedAt: stored.generatedAt,
  });

  revalidatePath(
    `/projects/${projectId}/scenes/${sceneId}/results/${parsedId.data}`,
  );
  return { ok: true, data: stored };
}

function fail(message: string): ActionResult<StoredMixAdvice> {
  return { ok: false, error: { code: "VALIDATION_ERROR", message } };
}
