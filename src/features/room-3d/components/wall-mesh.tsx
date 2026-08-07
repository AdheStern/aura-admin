// src/features/room-3d/components/wall-mesh.tsx — un muro extruido, pintado por su NRC.
// FrontSide y no DoubleSide: con las normales hacia dentro (ver extrude-room.ts) es lo que descarta
// los muros que quedan entre la cámara y el interior, y deja ver y clicar lo que hay en la sala.

"use client";

import { useMemo } from "react";
import { FrontSide } from "three";
import { quadGeometry } from "@/features/room-3d/components/geometry-builders";
import type { WallPiece } from "@/features/room-3d/model/extrude-room";
import { encodeMeshName } from "@/features/room-3d/model/mesh-selection";

export function WallMesh({
  piece,
  color,
}: {
  piece: WallPiece;
  color: string;
}) {
  const geometry = useMemo(() => quadGeometry(piece.corners), [piece.corners]);

  return (
    <mesh name={encodeMeshName(piece.selection)} geometry={geometry}>
      <meshStandardMaterial color={color} side={FrontSide} />
    </mesh>
  );
}
