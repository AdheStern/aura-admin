// src/features/simulation/queries/get-latest-job.ts — el job vigente de una escena, para la barra.
//
// La fuente de verdad del estado de un job es esta tabla, no el motor: su store vive en el proceso
// y no sobrevive a un reinicio (ADR-01), así que un job que el motor ya no conoce puede seguir
// existiendo perfectamente aquí.

import { db } from "@/lib/db";
import type { EngineJobStatus, JobError } from "@/lib/engine-client.types";

export type LatestJob = {
  jobId: string;
  simulationId: string;
  status: EngineJobStatus;
  progress: number;
  error: JobError | null;
};

export async function getLatestJob(sceneId: string): Promise<LatestJob | null> {
  const simulation = await db.simulation.findFirst({
    where: { sceneId },
    orderBy: { createdAt: "desc" },
    select: { id: true, job: true },
  });

  if (!simulation?.job) return null;

  const { job } = simulation;
  return {
    jobId: job.id,
    simulationId: simulation.id,
    status: job.status as EngineJobStatus,
    progress: job.progress,
    error: (job.error as JobError | null) ?? null,
  };
}
