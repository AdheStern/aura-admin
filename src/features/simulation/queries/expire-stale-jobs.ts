// src/features/simulation/queries/expire-stale-jobs.ts — el corte de 10 minutos de la Sección 08.
//
// Un job sin latido durante 10 minutos se da por muerto. Hace falta porque el motor puede caerse a
// mitad del cálculo sin llegar a entregar nada: su store vive en el proceso (ADR-01) y con él se va
// la única señal de que ese job existía. Sin este corte esos jobs se quedarían en RUNNING para
// siempre y la UI mostraría una barra que no avanza nunca.
//
// Se mide sobre `updatedAt`, que cada latido refresca. Un job largo pero vivo late cada 5 % de
// avance, muy por debajo del corte.

import { db } from "@/lib/db";
import { asJson } from "@/lib/prisma-json";

export const STALE_AFTER_MS = 10 * 60 * 1000;

export async function expireStaleJobs(now = new Date()): Promise<number> {
  const deadline = new Date(now.getTime() - STALE_AFTER_MS);

  const { count } = await db.simulationJob.updateMany({
    where: {
      status: { in: ["QUEUED", "RUNNING"] },
      updatedAt: { lt: deadline },
    },
    data: {
      status: "FAILED",
      finishedAt: now,
      error: asJson({
        code: "TIMEOUT",
        message: "El motor dejó de reportar progreso durante 10 minutos.",
      }),
    },
  });

  return count;
}
