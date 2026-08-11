// src/features/simulation/queries/record-job-outcome.ts — cierra un job con el callback del motor.
//
// Se acepta desde QUEUED **o** RUNNING. La Sección 08 dice "solo si está RUNNING", pero un fallo
// temprano —un GEOMETRY_INVALID que solo aparece al construir la sala— llega ANTES del primer
// latido, con el job todavía en QUEUED: aplicar la regla al pie perdería justo esos errores.
//
// Un job ya terminado no es un error, es un reintento: se ignora y se responde OK. El motor trata
// cualquier 4xx como fatal y dejaría de reintentar, así que rechazar aquí sería peor que ignorar.

import type { SimulationResult } from "@/contracts";
import { toSimResults } from "@/features/simulation/model/to-sim-results";
import { db } from "@/lib/db";
import type { JobError } from "@/lib/engine-client.types";
import { asJson, asNullableJson } from "@/lib/prisma-json";

export type JobOutcome = { result: SimulationResult } | { error: JobError };
export type OutcomeResult = "applied" | "unknown_job" | "already_finished";

const ACCEPTED_FROM = ["QUEUED", "RUNNING"];

export async function recordJobOutcome(
  jobId: string,
  outcome: JobOutcome,
): Promise<OutcomeResult> {
  const job = await db.simulationJob.findUnique({
    where: { id: jobId },
    select: {
      status: true,
      simulationId: true,
      simulation: { select: { sceneId: true } },
    },
  });

  if (!job) return "unknown_job";
  if (!ACCEPTED_FROM.includes(job.status)) return "already_finished";

  if ("error" in outcome) {
    await failJob(jobId, outcome.error);
    return "applied";
  }

  await completeJob(
    jobId,
    job.simulationId,
    job.simulation.sceneId,
    outcome.result,
  );
  return "applied";
}

async function failJob(jobId: string, error: JobError): Promise<void> {
  await db.simulationJob.update({
    where: { id: jobId },
    // La Sección 08 exige que un FAILED guarde siempre code y details: sin ellos la UI solo puede
    // decir "falló", que es lo mismo que no decir nada.
    data: { status: "FAILED", error: asJson(error), finishedAt: new Date() },
  });
}

async function completeJob(
  jobId: string,
  simulationId: string,
  sceneId: string,
  result: SimulationResult,
): Promise<void> {
  const rows = toSimResults(result);

  await db.$transaction([
    db.simulationJob.update({
      where: { id: jobId },
      data: { status: "COMPLETED", progress: 100, finishedAt: new Date() },
    }),
    db.simResult.createMany({
      data: rows.map((row) => ({
        simulationId,
        kind: row.kind,
        summary: asNullableJson(row.summary),
        payload: asNullableJson(row.payload),
      })),
    }),
    // Solo desde ROOM_READY: es el "primer job COMPLETED" de la Sección 08. Si la escena ya se
    // editó y volvió atrás, el resultado se guarda igual pero no la reasciende a SIMULATED.
    db.scene.updateMany({
      where: { id: sceneId, status: "ROOM_READY" },
      data: { status: "SIMULATED" },
    }),
  ]);
}
