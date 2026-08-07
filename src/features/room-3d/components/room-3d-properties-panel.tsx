// src/features/room-3d/components/room-3d-properties-panel.tsx — la columna derecha del editor 3D.
//
// Intercepta la selección de parlante y delega TODO lo demás en el PropertiesPanel del editor 2D:
// muro, pilar, abertura y zona se editan igual desde las dos vistas, y duplicar esos paneles aquí
// sería mantener dos veces el mismo formulario. El parlante no puede vivir allí porque su estado no
// está en el room-store (ver speaker-store.tsx), y el editor 2D no lo tiene montado.

"use client";

import { SpeakerPanel } from "@/features/room-3d/components/speaker-panel";
import { PropertiesPanel } from "@/features/room-editor/components/properties-panel";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function Room3dPropertiesPanel() {
  const selection = useRoomStore((state) => state.selection);

  if (selection?.kind === "speaker") {
    return (
      <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l bg-background p-4">
        <SpeakerPanel nodeId={selection.id} />
      </aside>
    );
  }
  return <PropertiesPanel />;
}
