// src/features/simulation/store/simulation-store.tsx — el borrador de ambiente y configuración.
//
// Tercer store del editor 3D, y no es acumulación: cada uno tiene un dueño distinto y una columna
// distinta detrás. El recinto (room-store) guarda geometría y colocación en Scene.room, el grafo
// (speaker-store) los ajustes de la caja en Scene.signalFlow, y este el borrador de simulación en
// Scene.simulation. Fundirlos obligaría al editor 2D, que no sabe de ninguno de los dos últimos, a
// construirlos igualmente para poder montar el suyo.

"use client";

import { createContext, type ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import type {
  SimulationConfig,
  SimulationEnvironment,
} from "@/contracts/simulation-request.schema";
import type { SceneSimulation } from "@/features/simulation/schemas/scene-simulation";

export type SimulationStoreInit = {
  sceneId: string;
  canManage: boolean;
  simulation: SceneSimulation;
};

export type SimulationStoreState = SimulationStoreInit & {
  isDirty: boolean;
  setEnvironment: (patch: Partial<SimulationEnvironment>) => void;
  setConfig: (patch: Partial<SimulationConfig>) => void;
  markSaved: () => void;
};

export type SimulationStore = ReturnType<typeof createSimulationStore>;

export function createSimulationStore(init: SimulationStoreInit) {
  return createStore<SimulationStoreState>()((set, get) => ({
    ...init,
    isDirty: false,

    setEnvironment: (patch) =>
      set({
        simulation: {
          ...get().simulation,
          environment: { ...get().simulation.environment, ...patch },
        },
        isDirty: true,
      }),

    setConfig: (patch) =>
      set({
        simulation: {
          ...get().simulation,
          config: { ...get().simulation.config, ...patch },
        },
        isDirty: true,
      }),

    markSaved: () => set({ isDirty: false }),
  }));
}

const SimulationStoreContext = createContext<SimulationStore | null>(null);

export function SimulationStoreProvider({
  init,
  children,
}: {
  init: SimulationStoreInit;
  children: ReactNode;
}) {
  const storeRef = useRef<SimulationStore | null>(null);
  storeRef.current ??= createSimulationStore(init);

  return (
    <SimulationStoreContext.Provider value={storeRef.current}>
      {children}
    </SimulationStoreContext.Provider>
  );
}

export function useSimulationStore<T>(
  selector: (state: SimulationStoreState) => T,
): T {
  const store = useContext(SimulationStoreContext);
  if (!store) {
    throw new Error(
      "useSimulationStore debe usarse dentro de <SimulationStoreProvider>",
    );
  }
  return useStore(store, selector);
}
