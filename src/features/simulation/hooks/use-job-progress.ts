// src/features/simulation/hooks/use-job-progress.ts — sondea el job mientras siga vivo.
//
// Para de sondear en cuanto el job termina: el motor no vuelve a tocarlo y seguir preguntando solo
// gastaría viajes. Al montar pregunta una vez, para que recargar la página con un job en curso
// muestre la barra donde estaba y no desde cero.

"use client";

import { useCallback, useEffect, useState } from "react";
import { readLatestJob } from "@/features/simulation/actions/read-latest-job";
import type { LatestJob } from "@/features/simulation/queries/get-latest-job";

const POLL_MS = 1500;
const LIVE = ["QUEUED", "RUNNING"];

export function useJobProgress(sceneId: string) {
  const [job, setJob] = useState<LatestJob | null>(null);

  const refresh = useCallback(async () => {
    const result = await readLatestJob(sceneId);
    if (result.ok) setJob(result.data);
  }, [sceneId]);

  const isLive = job !== null && LIVE.includes(job.status);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isLive) return;
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [isLive, refresh]);

  return { job, isLive, refresh };
}
