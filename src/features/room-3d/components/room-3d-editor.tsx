// src/features/room-3d/components/room-3d-editor.tsx — raíz cliente del editor 3D: mismo
// RoomStoreProvider que el editor 2D (mismo documento, mismo historial, mismos paneles de material),
// con el lienzo R3F en el centro en vez del canvas Konva.
//
// Dos stores y dos autosaves porque son dos dueños: el recinto guarda la geometría y la colocación
// de las cajas, y el grafo guarda sus ajustes de audio (ver speaker-store.tsx).

"use client";

import { useState } from "react";
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
import { SplLegend } from "@/features/simulation/components/results/spl-legend";
import { useAutosaveSimulation } from "@/features/simulation/hooks/use-autosave-simulation";
import type { SplOverlay } from "@/features/simulation/queries/get-latest-spl-grid";
import type { SceneSimulation } from "@/features/simulation/schemas/scene-simulation";
import { SimulationStoreProvider } from "@/features/simulation/store/simulation-store";

export function Room3dEditor({
  init,
  speakers,
  simulation,
  materialColorsById,
  overlay,
}: {
  init: RoomStoreInit;
  speakers: SpeakerStoreInit["speakers"];
  simulation: SceneSimulation;
  materialColorsById: MaterialNrcById;
  /** Cobertura de la última simulación completada, o null si no hay ninguna. */
  overlay: SplOverlay | null;
}) {
  const scoped = { sceneId: init.sceneId, canManage: init.canManage };
  // Encendido cuando hay algo que enseñar: quien acaba de simular quiere ver el resultado, no
  // buscar el interruptor. El estado vive aquí porque lo comparten la barra y el lienzo.
  const [showMap, setShowMap] = useState(true);

  return (
    <RoomStoreProvider init={init}>
      <SpeakerStoreProvider init={{ ...scoped, speakers }}>
        <SimulationStoreProvider init={{ ...scoped, simulation }}>
          <div className="flex h-[80vh] min-h-[600px] flex-col rounded-lg border">
            <Room3dToolbar
              hasOverlay={overlay !== null}
              showMap={showMap}
              onToggleMap={() => setShowMap((shown) => !shown)}
            />
            <div className="flex min-h-0 flex-1">
              <CanvasWithAutosave
                materialColorsById={materialColorsById}
                overlay={showMap ? overlay : null}
              />
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
  overlay,
}: {
  materialColorsById: MaterialNrcById;
  overlay: SplOverlay | null;
}) {
  useAutosaveRoom();
  useAutosaveSpeakerAudio();
  useAutosaveSimulation();

  return (
    <div className="relative flex min-w-0 flex-1">
      <Room3dCanvas materialColorsById={materialColorsById} overlay={overlay} />
      {/* La escala va SIEMPRE que haya mapa: cuatro tonos para magnitud solo valen con su leyenda
          a la vista, o el color no dice cuántos dB son. */}
      {overlay ? (
        <div className="pointer-events-none absolute bottom-3 left-3 w-64 rounded-md border bg-background/90 p-2">
          <SplLegend unit="dBA" />
        </div>
      ) : null}
    </div>
  );
}
