// src/features/room-3d/components/room-3d-editor.tsx — raíz cliente del editor 3D: mismo
// RoomStoreProvider que el editor 2D (mismo documento, mismo historial, mismo PropertiesPanel para
// el panel de materiales), con el lienzo R3F en el centro en vez del canvas Konva.

"use client";

import { Room3dCanvas } from "@/features/room-3d/components/room-3d-canvas";
import { Room3dToolbar } from "@/features/room-3d/components/room-3d-toolbar";
import type { MaterialNrcById } from "@/features/room-3d/queries/list-room-material-colors";
import { PropertiesPanel } from "@/features/room-editor/components/properties-panel";
import { useAutosaveRoom } from "@/features/room-editor/hooks/use-autosave-room";
import type { RoomStoreInit } from "@/features/room-editor/store/room-store";
import { RoomStoreProvider } from "@/features/room-editor/store/room-store-provider";

export function Room3dEditor({
  init,
  materialColorsById,
}: {
  init: RoomStoreInit;
  materialColorsById: MaterialNrcById;
}) {
  return (
    <RoomStoreProvider init={init}>
      <div className="flex h-[80vh] min-h-[600px] flex-col rounded-lg border">
        <Room3dToolbar />
        <div className="flex min-h-0 flex-1">
          <CanvasWithAutosave materialColorsById={materialColorsById} />
          <PropertiesPanel />
        </div>
      </div>
    </RoomStoreProvider>
  );
}

function CanvasWithAutosave({
  materialColorsById,
}: {
  materialColorsById: MaterialNrcById;
}) {
  useAutosaveRoom();
  return <Room3dCanvas materialColorsById={materialColorsById} />;
}
