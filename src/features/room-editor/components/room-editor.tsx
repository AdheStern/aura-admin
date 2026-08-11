// src/features/room-editor/components/room-editor.tsx — raíz cliente del editor 2D: acciones de
// documento arriba, herramientas en la tira izquierda, lienzo al centro y propiedades a la derecha.
// El autosave va dentro del Provider para que tenga acceso al store recién creado.
//
// El reparto se aparta del de signal-flow/flow-editor.tsx (que sí pone todo en la barra superior)
// porque un CAD tiene el doble de herramientas y se cambia de una a otra constantemente: la tira
// lateral las deja siempre a la misma distancia del puntero, sin competir con las acciones sobre el
// documento entero.

"use client";

import { PropertiesPanel } from "@/features/room-editor/components/properties-panel";
import { RoomCanvas } from "@/features/room-editor/components/room-canvas";
import { RoomToolbar } from "@/features/room-editor/components/room-toolbar";
import { ToolSidebar } from "@/features/room-editor/components/tool-sidebar";
import { useAutosaveRoom } from "@/features/room-editor/hooks/use-autosave-room";
import type { RoomStoreInit } from "@/features/room-editor/store/room-store";
import { RoomStoreProvider } from "@/features/room-editor/store/room-store-provider";

export function RoomEditor({ init }: { init: RoomStoreInit }) {
  return (
    <RoomStoreProvider init={init}>
      <div className="flex h-[80vh] min-h-[600px] flex-col rounded-lg border">
        <RoomToolbar />
        <div className="flex min-h-0 flex-1">
          <ToolSidebar />
          <RoomCanvasWithAutosave />
          <PropertiesPanel />
        </div>
      </div>
    </RoomStoreProvider>
  );
}

function RoomCanvasWithAutosave() {
  useAutosaveRoom();
  return <RoomCanvas />;
}
