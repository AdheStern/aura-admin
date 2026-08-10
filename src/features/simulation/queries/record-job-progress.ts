// src/features/simulation/queries/record-job-progress.ts — aplica un latido de progreso del motor.
//
// El latido es best-effort del lado del motor: no lo reintenta y se traga un 404. Aquí solo sirve
// para dos cosas — mover la barra y refrescar `updatedAt`, que es lo que impide que el cron de la
// Sección 08 marque FAILED:TIMEOUT un job largo que va perfectamente.

import { db } from "@/lib/db";

export type ProgressOutcome = "applied" | "unknown_job" | "already_finished";

const FINISHED = ["COMPLETED", "FAILED", "CANCELLED"];

export async function recordJobProgress(
  jobId: string,
  progress: number,
): Promise<ProgressOutcome> {
  const job = await db.simulationJob.findUnique({
    where: { id: jobId },
    select: { status: true, progress: true, startedAt: true },
  });

  if (!job) return "unknown_job";
  if (FINISHED.includes(job.status)) return "already_finished";

  await db.simulationJob.update({
    where: { id: jobId },
    data: {
      status: "RUNNING",
      // Monótono: el motor ya lo envía creciente, pero una barra que retrocede parece un fallo y
      // no vale la pena depender de que ningún reintento llegue desordenado.
      progress: Math.max(job.progress, clamp(progress)),
      startedAt: job.startedAt ?? new Date(),
    },
  });

  return "applied";
}

function clamp(progress: number): number {
  return Math.min(100, Math.max(0, Math.trunc(progress)));
}
