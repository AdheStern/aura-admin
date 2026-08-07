// src/features/room-3d/components/room-3d-properties-panel.tsx — la columna derecha del editor 3D.
//
// Intercepta lo que solo existe en 3D —el parlante elegido y, sin selección, ambiente y
// configuración de simulación— y delega TODO lo demás en el PropertiesPanel del editor 2D: muro,
// pilar, abertura y zona se editan igual desde las dos vistas, y duplicar esos paneles aquí sería
// mantener dos veces el mismo formulario. Ninguno de los dos casos propios cabe allí, porque su
// estado no está en el room-store y el editor 2D no lo tiene montado.

"use client";

import { Room3dScenePanel } from "@/features/room-3d/components/room-3d-scene-panel";
import { SpeakerPanel } from "@/features/room-3d/components/speaker-panel";
import { PropertiesPanel } from "@/features/room-editor/components/properties-panel";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function Room3dPropertiesPanel() {
  const selection = useRoomStore((state) => state.selection);

  if (selection !== null && selection.kind !== "speaker") {
    return <PropertiesPanel />;
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l bg-background p-4">
      {selection?.kind === "speaker" ? (
        <SpeakerPanel nodeId={selection.id} />
      ) : (
        <Room3dScenePanel />
      )}
    </aside>
  );
}
