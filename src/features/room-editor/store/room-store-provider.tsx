// src/features/room-editor/store/room-store-provider.tsx — wiring de contexto del store vanilla.
// Mismo patrón que flow-store-provider.tsx: el store se crea con useRef dentro del Provider (una
// instancia por montaje de <RoomEditor>) y se expone por contexto, nunca como singleton de módulo.

"use client";

import { createContext, type ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";
import {
  createRoomStore,
  type RoomStore,
  type RoomStoreInit,
  type RoomStoreState,
} from "@/features/room-editor/store/room-store";

const RoomStoreContext = createContext<RoomStore | null>(null);

export function RoomStoreProvider({
  init,
  children,
}: {
  init: RoomStoreInit;
  children: ReactNode;
}) {
  const storeRef = useRef<RoomStore | null>(null);
  storeRef.current ??= createRoomStore(init);

  return (
    <RoomStoreContext.Provider value={storeRef.current}>
      {children}
    </RoomStoreContext.Provider>
  );
}

export function useRoomStore<T>(selector: (state: RoomStoreState) => T): T {
  const store = useContext(RoomStoreContext);
  if (!store) {
    throw new Error("useRoomStore debe usarse dentro de <RoomStoreProvider>");
  }
  return useStore(store, selector);
}
