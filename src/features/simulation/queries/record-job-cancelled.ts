// src/features/simulation/queries/record-job-cancelled.ts — cerrar un job que el usuario paró.
//
// Es el ÚNICO estado final que no llega por la ruta de ingesta: una cancelación no genera callback
// porque la app ya sabe que canceló —lo pidió ella— y el cuerpo del callback solo admite un
// resultado o un error, y esto no es ninguno de los dos.
//
// Solo cierra un job vivo. Si entretanto llegó el resultado, el trabajo ya estaba hecho y pisarlo
// con CANCELLED tiraría un cálculo bueno que el usuario puede mirar igual.

import { db } from "@/lib/db";

export type CancelRecord = "cancelled" | "already_finished";

export async function recordJobCancelled(jobId: string): Promise<CancelRecord> {
  const { count } = await db.simulationJob.updateMany({
    where: { id: jobId, status: { in: ["QUEUED", "RUNNING"] } },
    data: { status: "CANCELLED", finishedAt: new Date() },
  });

  return count > 0 ? "cancelled" : "already_finished";
}
