// src/app/api/internal/jobs/[jobId]/route.ts — callback de cierre del motor (Sección 07).
// Recibe un SimulationResult o un envelope {error}, verifica el HMAC y cierra el job.
//
// NUNCA responde 4xx por un callback que simplemente ya no aplica: el _deliver del motor trata
// cualquier 4xx como fatal y deja de reintentar. Un duplicado o un job ya cerrado se ignoran con
// 200 — es idempotencia, no un rechazo. El 401 sí es 4xx a propósito: reenviar la misma firma
// inválida daría lo mismo, y que el motor se rinda rápido es lo correcto.

import { engineErrorEnvelopeSchema, simulationResultSchema } from "@/contracts";
import {
  type JobOutcome,
  recordJobOutcome,
} from "@/features/simulation/queries/record-job-outcome";
import { readSignedCallback, unauthorized } from "@/lib/engine-callback";
import { logger } from "@/lib/logger";

export async function POST(
  request: Request,
  context: RouteContext<"/api/internal/jobs/[jobId]">,
) {
  const { jobId } = await context.params;

  const rawBody = await readSignedCallback(request);
  if (rawBody === null) {
    // Se loggea porque una firma que no cuadra suele ser un secreto distinto en cada lado, y sin
    // esta línea el síntoma es un job que se queda en QUEUED sin que nada explique por qué.
    logger.warn("callback con firma inválida", { jobId });
    return unauthorized();
  }

  const outcome = parseOutcome(rawBody);
  if (!outcome) {
    logger.warn("callback con cuerpo no reconocido", { jobId });
    return Response.json({ detail: "cuerpo no reconocido" }, { status: 400 });
  }

  const applied = await recordJobOutcome(jobId, outcome);
  logger.info("callback aplicado", {
    jobId,
    outcome: applied,
    kind: "error" in outcome ? "error" : "result",
  });

  return Response.json({ outcome: applied });
}

/** El motor entrega una de dos formas por la misma ruta; el envelope se prueba primero por ser
 *  el más estrecho de los dos. */
function parseOutcome(rawBody: string): JobOutcome | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return null;
  }

  const failure = engineErrorEnvelopeSchema.safeParse(parsed);
  if (failure.success) return { error: failure.data.error };

  const success = simulationResultSchema.safeParse(parsed);
  return success.success ? { result: success.data } : null;
}
