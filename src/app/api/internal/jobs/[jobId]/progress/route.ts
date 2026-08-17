// src/app/api/internal/jobs/[jobId]/progress/route.ts — latido de progreso del motor (ADR 0008).
//
// Best-effort del otro lado: el motor no lo reintenta y se traga hasta un 404, así que aquí nada
// justifica un 5xx. Pero sin él el cron de 10 minutos de la Sección 08 marcaría FAILED:TIMEOUT
// todo job largo, que es justo lo que este latido existe para evitar.

import { z } from "zod";
import { recordJobProgress } from "@/features/simulation/queries/record-job-progress";
import { readSignedCallback, unauthorized } from "@/lib/engine-callback";
import { logger } from "@/lib/logger";

const progressBodySchema = z.object({
  progress: z.number().int().min(0).max(100),
});

export async function POST(
  request: Request,
  context: RouteContext<"/api/internal/jobs/[jobId]/progress">,
) {
  const rawBody = await readSignedCallback(request);
  if (rawBody === null) return unauthorized();

  const body = progressBodySchema.safeParse(safeJson(rawBody));
  if (!body.success) {
    return Response.json({ detail: "progress inválido" }, { status: 400 });
  }

  const { jobId } = await context.params;
  const outcome = await recordJobProgress(jobId, body.data.progress);

  // El latido en sí NO se loggea: llega cada 5 % y ahogaría todo lo demás. Solo lo que no cuadra —
  // un latido para un job que la app no conoce delata jobId cruzados o una base que se restauró.
  if (outcome !== "applied") {
    logger.warn("latido de un job que no está vivo", { jobId, outcome });
  }

  return Response.json({ outcome });
}

function safeJson(rawBody: string): unknown {
  try {
    return JSON.parse(rawBody);
  } catch {
    return null;
  }
}
