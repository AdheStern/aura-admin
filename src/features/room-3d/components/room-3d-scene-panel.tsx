// src/features/room-3d/components/room-3d-scene-panel.tsx — lo que el editor 3D muestra cuando no
// hay nada elegido: las cotas del recinto (reusando el panel del 2D) más lo que solo existe aquí,
// ambiente y configuración de simulación (§5.3).
//
// Ambiente y configuración no cuelgan de ninguna figura del lienzo, así que no caben en el panel de
// propiedades por selección: son de la ESCENA entera, y este es el único hueco de la UI donde eso
// se lee sin inventar otra pantalla.

"use client";

import { useSpeakerStore } from "@/features/room-3d/store/speaker-store";
import { IdlePanel } from "@/features/room-editor/components/panels/idle-panel";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";
import { EnvironmentPanel } from "@/features/simulation/components/environment-panel";
import { SimulateButton } from "@/features/simulation/components/simulate-button";
import { SimulationConfigPanel } from "@/features/simulation/components/simulation-config-panel";
import { canSimulate } from "@/features/simulation/model/can-simulate";

export function Room3dScenePanel() {
  const sceneId = useRoomStore((state) => state.sceneId);
  const canManage = useRoomStore((state) => state.canManage);
  const document = useRoomStore((state) => state.document);
  const sceneStatus = useRoomStore((state) => state.sceneStatus);
  const speakerCount = useSpeakerStore((state) => state.speakers.length);

  const readiness = canSimulate({ sceneStatus, document, speakerCount });

  return (
    <>
      <IdlePanel />
      <EnvironmentPanel />
      <SimulationConfigPanel />
      <SimulateButton
        sceneId={sceneId}
        canManage={canManage}
        blockers={readiness.blockers}
      />
    </>
  );
}
