// src/features/room-3d/components/room-mesh.tsx — arma la escena de extrudeRoom(document) y
// despacha el picking al MISMO store del editor 2D: un click aquí llama a select(), exactamente lo
// que ya hace un click en el plano, así que PropertiesPanel no necesita saber si vino del 2D o del
// 3D.

"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { FloorCeilingMesh } from "@/features/room-3d/components/floor-ceiling-mesh";
import { ObstacleMesh } from "@/features/room-3d/components/obstacle-mesh";
import { OpeningOverlay } from "@/features/room-3d/components/opening-overlay";
import { WallMesh } from "@/features/room-3d/components/wall-mesh";
import { extrudeRoom } from "@/features/room-3d/model/extrude-room";
import { decodeMeshName } from "@/features/room-3d/model/mesh-selection";
import { deriveNrc, nrcColorHex } from "@/features/room-3d/model/nrc-color";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

/** Mismo azul que wallSelected/obstacleSelected/openingSelected en canvas-palette.ts (2D): la
 *  selección tiene que leerse igual sin importar desde qué vista se hizo el click. */
const SELECTED_HEX = "#0ea5e9";

export function RoomMesh() {
  const document = useRoomStore((state) => state.document);
  const selection = useRoomStore((state) => state.selection);
  const select = useRoomStore((state) => state.select);
  const materialSpecById = useRoomStore((state) => state.materialSpecById);
  const extruded = useMemo(() => extrudeRoom(document), [document]);

  function handlePick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    const decoded = decodeMeshName(event.object.name);
    if (decoded) select(decoded);
  }

  function colorFor(materialId: string | null, id: string): string {
    if (selection !== null && "id" in selection && selection.id === id) {
      return SELECTED_HEX;
    }
    const spec = materialId ? materialSpecById.get(materialId) : undefined;
    return nrcColorHex(spec ? deriveNrc(spec) : null);
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: <group> es un nodo three.js (r3f), no DOM
    <group onClick={handlePick}>
      {extruded.walls.map((wall) => (
        <WallMesh
          key={wall.selection.id}
          piece={wall}
          color={colorFor(wall.materialId, wall.selection.id)}
        />
      ))}
      <FloorCeilingMesh
        piece={extruded.floor}
        color={colorFor(extruded.floor.materialId, extruded.floor.selection.id)}
      />
      <FloorCeilingMesh
        piece={extruded.ceiling}
        color={colorFor(
          extruded.ceiling.materialId,
          extruded.ceiling.selection.id,
        )}
      />
      {extruded.obstacles.map((obstacle) => (
        <ObstacleMesh
          key={obstacle.selection.id}
          piece={obstacle}
          color={colorFor(obstacle.materialId, obstacle.selection.id)}
        />
      ))}
      {extruded.openings.map((opening) => (
        <OpeningOverlay
          key={opening.selection.id}
          piece={opening}
          color={colorFor(opening.materialId, opening.selection.id)}
        />
      ))}
    </group>
  );
}
