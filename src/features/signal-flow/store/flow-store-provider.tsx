// src/features/signal-flow/store/flow-store-provider.tsx — wiring de contexto del store vanilla.
// Patrón oficial de Zustand con Next.js: el store se crea con useRef dentro del Provider (una
// instancia por montaje de <FlowEditor>) y se expone por contexto, nunca como singleton de módulo.

"use client";

import { createContext, type ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";
import {
  createFlowStore,
  type FlowStore,
  type FlowStoreInit,
  type FlowStoreState,
} from "@/features/signal-flow/store/flow-store";

const FlowStoreContext = createContext<FlowStore | null>(null);

export function FlowStoreProvider({
  init,
  children,
}: {
  init: FlowStoreInit;
  children: ReactNode;
}) {
  const storeRef = useRef<FlowStore | null>(null);
  storeRef.current ??= createFlowStore(init);

  return (
    <FlowStoreContext.Provider value={storeRef.current}>
      {children}
    </FlowStoreContext.Provider>
  );
}

export function useFlowStore<T>(selector: (state: FlowStoreState) => T): T {
  const store = useContext(FlowStoreContext);
  if (!store) {
    throw new Error("useFlowStore debe usarse dentro de <FlowStoreProvider>");
  }
  return useStore(store, selector);
}
