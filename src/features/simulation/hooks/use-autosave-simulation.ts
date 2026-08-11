// src/features/simulation/hooks/use-autosave-simulation.ts — mismo debounce de 1.5 s que
// use-autosave-room, sobre la columna Scene.simulation.

"use client";

import { useEffect, useRef } from "react";
import { saveSceneSimulation } from "@/features/simulation/actions/save-scene-simulation";
import type { SceneSimulation } from "@/features/simulation/schemas/scene-simulation";
import { useSimulationStore } from "@/features/simulation/store/simulation-store";

const DEBOUNCE_MS = 1500;

export function useAutosaveSimulation(): void {
  const sceneId = useSimulationStore((state) => state.sceneId);
  const canManage = useSimulationStore((state) => state.canManage);
  const simulation = useSimulationStore((state) => state.simulation);
  const isDirty = useSimulationStore((state) => state.isDirty);
  const markSaved = useSimulationStore((state) => state.markSaved);

  // Ref y no cierre: el temporizador dispara más tarde y sin esto guardaría el valor del render en
  // que se programó, no el último que tecleó el usuario.
  const latest = useRef<SceneSimulation>(simulation);
  latest.current = simulation;

  // `simulation` no se lee en el cuerpo: se declara para que cada cambio reinicie el debounce.
  // biome-ignore lint/correctness/useExhaustiveDependencies: ver comentario de arriba
  useEffect(() => {
    if (!canManage || !isDirty) return;

    const timeoutId = setTimeout(() => {
      void saveSceneSimulation(sceneId, latest.current).then((result) => {
        if (result.ok) markSaved();
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [simulation, isDirty, sceneId, canManage, markSaved]);
}
