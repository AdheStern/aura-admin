// src/features/simulation/components/job-status.tsx — qué está haciendo el job vigente.
//
// La barra avanza A SALTOS y eso es lo esperado, no un fallo: el 0–100 se reparte a partes iguales
// entre los métodos pedidos y el híbrido tarda órdenes de magnitud más que el estadístico.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CancelButton } from "@/features/simulation/components/cancel-button";
import type { LatestJob } from "@/features/simulation/queries/get-latest-job";

const LABELS: Record<string, string> = {
  QUEUED: "En cola…",
  RUNNING: "Simulando…",
  COMPLETED: "Simulación completada",
  FAILED: "La simulación falló",
  CANCELLED: "Simulación cancelada",
};

export function JobStatus({
  job,
  sceneId,
  canManage,
  onCancelled,
}: {
  job: LatestJob;
  sceneId: string;
  canManage: boolean;
  onCancelled: () => void;
}) {
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

      {isLive && canManage ? (
        <CancelButton sceneId={sceneId} onCancelled={onCancelled} />
      ) : null}

      {job.error ? (
        <p className="text-xs text-destructive">
          {job.error.code}: {job.error.message}
        </p>
      ) : null}

      {job.status === "COMPLETED" ? (
        <ResultsLink simulationId={job.simulationId} />
      ) : null}
    </div>
  );
}

/** La ruta de resultados es hermana de la del editor, así que se deriva de dónde estamos en vez de
 *  arrastrar el projectId por props hasta aquí. */
function ResultsLink({ simulationId }: { simulationId: string }) {
  const pathname = usePathname();
  const href = pathname.replace(/\/room\/3d$/, `/results/${simulationId}`);

  return (
    <Link
      href={href}
      className="text-xs font-medium underline underline-offset-4"
    >
      Ver resultados
    </Link>
  );
}
