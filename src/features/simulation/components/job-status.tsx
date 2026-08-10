// src/features/simulation/components/job-status.tsx — qué está haciendo el job vigente.
//
// La barra avanza A SALTOS y eso es lo esperado, no un fallo: el 0–100 se reparte a partes iguales
// entre los métodos pedidos y el híbrido tarda órdenes de magnitud más que el estadístico.

"use client";

import type { LatestJob } from "@/features/simulation/queries/get-latest-job";

const LABELS: Record<string, string> = {
  QUEUED: "En cola…",
  RUNNING: "Simulando…",
  COMPLETED: "Simulación completada",
  FAILED: "La simulación falló",
  CANCELLED: "Simulación cancelada",
};

export function JobStatus({ job }: { job: LatestJob }) {
  const isLive = job.status === "QUEUED" || job.status === "RUNNING";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{LABELS[job.status]}</span>
        {isLive ? <span className="tabular-nums">{job.progress}%</span> : null}
      </div>

      {isLive ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-[width] duration-500"
            style={{ width: `${job.progress}%` }}
          />
        </div>
      ) : null}

      {job.error ? (
        <p className="text-xs text-destructive">
          {job.error.code}: {job.error.message}
        </p>
      ) : null}
    </div>
  );
}
