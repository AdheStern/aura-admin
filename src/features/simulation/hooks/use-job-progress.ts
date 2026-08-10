// src/features/simulation/hooks/use-job-progress.ts — sondea el job mientras siga vivo.
//
// Para de sondear en cuanto el job termina: el motor no vuelve a tocarlo y seguir preguntando solo
// gastaría viajes. Al montar pregunta una vez, para que recargar la página con un job en curso
// muestre la barra donde estaba y no desde cero.
//
// Al TERMINAR pide un refresco del servidor, una sola vez. Lo que la simulación cambia —el mapa de
// cobertura del 3D, el estado de la escena— lo pintan componentes de servidor que no se enteran de
// nada por su cuenta, y sin esto habría que recargar a mano justo después de esperar el cálculo.

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { readLatestJob } from "@/features/simulation/actions/read-latest-job";
import type { LatestJob } from "@/features/simulation/queries/get-latest-job";

const POLL_MS = 1500;
const LIVE = ["QUEUED", "RUNNING"];

export function useJobProgress(sceneId: string) {
  const router = useRouter();
  const [job, setJob] = useState<LatestJob | null>(null);
  const wasLive = useRef(false);

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

  // Solo en el flanco vivo → terminado. Refrescar en cada sondeo tiraría el trabajo del servidor
  // una vez por segundo y medio para nada.
  useEffect(() => {
    if (isLive) {
      wasLive.current = true;
      return;
    }
    if (wasLive.current) {
      wasLive.current = false;
      router.refresh();
    }
  }, [isLive, router]);

  return { job, isLive, refresh };
}
