// src/features/room-3d/components/room-3d-properties-panel.tsx — la columna derecha del editor 3D.
//
// Intercepta lo que solo existe en 3D —el parlante elegido y, sin selección, ambiente y
// configuración de simulación— y delega TODO lo demás en los paneles del editor 2D: muro, pilar,
// abertura y zona se editan igual desde las dos vistas, y duplicar esos formularios aquí sería
// mantenerlos dos veces. Ninguno de los dos casos propios cabe allí, porque su estado no está en el
// room-store y el editor 2D no lo tiene montado.
//
// La vuelta a la escena es un BOTÓN y no solo el clic en vacío que deselecciona en el 2D: aquí ese
// vacío es el cielo alrededor de la sala, y con la sala llenando la vista puede no quedar un píxel
// donde pinchar. Sin él, elegir un muro dejaba encerrado fuera del panel de escena —el que lleva
// ambiente, configuración y el botón de simular— hasta recargar la página.

"use client";

import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Room3dScenePanel } from "@/features/room-3d/components/room-3d-scene-panel";
import { SpeakerPanel } from "@/features/room-3d/components/speaker-panel";
import { SelectedPanel } from "@/features/room-editor/components/properties-panel";
import type { RoomSelection } from "@/features/room-editor/store/room-selection";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function Room3dPropertiesPanel() {
  const selection = useRoomStore((state) => state.selection);
  const select = useRoomStore((state) => state.select);

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l bg-background p-4">
      {selection ? (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => select(null)}
        >
          <ArrowLeftIcon />
          Volver a la escena
        </Button>
      ) : null}
      <PanelBody selection={selection} />
    </aside>
  );
}

function PanelBody({ selection }: { selection: RoomSelection | null }) {
  if (selection === null) return <Room3dScenePanel />;
  if (selection.kind === "speaker")
    return <SpeakerPanel nodeId={selection.id} />;
  return <SelectedPanel selection={selection} />;
}
