// src/features/room-3d/components/room-3d-editor.tsx — raíz cliente del editor 3D: mismo
// RoomStoreProvider que el editor 2D (mismo documento, mismo historial, mismos paneles de material),
// con el lienzo R3F en el centro en vez del canvas Konva.
//
// Dos stores y dos autosaves porque son dos dueños: el recinto guarda la geometría y la colocación
// de las cajas, y el grafo guarda sus ajustes de audio (ver speaker-store.tsx).

"use client";

import { Room3dCanvas } from "@/features/room-3d/components/room-3d-canvas";
import { Room3dPropertiesPanel } from "@/features/room-3d/components/room-3d-properties-panel";
import { Room3dToolbar } from "@/features/room-3d/components/room-3d-toolbar";
import { useAutosaveSpeakerAudio } from "@/features/room-3d/hooks/use-autosave-speaker-audio";
import type { MaterialNrcById } from "@/features/room-3d/queries/list-room-material-colors";
import {
  type SpeakerStoreInit,
  SpeakerStoreProvider,
} from "@/features/room-3d/store/speaker-store";
import { useAutosaveRoom } from "@/features/room-editor/hooks/use-autosave-room";
import type { RoomStoreInit } from "@/features/room-editor/store/room-store";
import { RoomStoreProvider } from "@/features/room-editor/store/room-store-provider";
import { useAutosaveSimulation } from "@/features/simulation/hooks/use-autosave-simulation";
import type { SceneSimulation } from "@/features/simulation/schemas/scene-simulation";
import { SimulationStoreProvider } from "@/features/simulation/store/simulation-store";

export function Room3dEditor({
  init,
  speakers,
  simulation,
  materialColorsById,
}: {
  init: RoomStoreInit;
  speakers: SpeakerStoreInit["speakers"];
  simulation: SceneSimulation;
  materialColorsById: MaterialNrcById;
}) {
  const scoped = { sceneId: init.sceneId, canManage: init.canManage };

  return (
    <RoomStoreProvider init={init}>
      <SpeakerStoreProvider init={{ ...scoped, speakers }}>
        <SimulationStoreProvider init={{ ...scoped, simulation }}>
          <div className="flex h-[80vh] min-h-[600px] flex-col rounded-lg border">
            <Room3dToolbar />
            <div className="flex min-h-0 flex-1">
              <CanvasWithAutosave materialColorsById={materialColorsById} />
              <Room3dPropertiesPanel />
            </div>
          </div>
        </SimulationStoreProvider>
      </SpeakerStoreProvider>
    </RoomStoreProvider>
  );
}

function CanvasWithAutosave({
  materialColorsById,
}: {
  materialColorsById: MaterialNrcById;
}) {
  useAutosaveRoom();
  useAutosaveSpeakerAudio();
  useAutosaveSimulation();
  return <Room3dCanvas materialColorsById={materialColorsById} />;
}
