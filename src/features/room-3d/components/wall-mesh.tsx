// src/features/room-3d/components/wall-mesh.tsx — un muro extruido, pintado por su NRC.

"use client";

import { useMemo } from "react";
import { DoubleSide } from "three";
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
      <meshStandardMaterial color={color} side={DoubleSide} />
    </mesh>
  );
}
