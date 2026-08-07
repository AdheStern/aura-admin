// src/features/room-3d/components/floor-ceiling-mesh.tsx — piso o techo, triangulado en abanico.

"use client";

import { useMemo } from "react";
import { FrontSide } from "three";
import { triangleFanGeometry } from "@/features/room-3d/components/geometry-builders";
import type { FloorCeilingPiece } from "@/features/room-3d/model/extrude-room";
import { encodeMeshName } from "@/features/room-3d/model/mesh-selection";

export function FloorCeilingMesh({
  piece,
  color,
}: {
  piece: FloorCeilingPiece;
  color: string;
}) {
  const geometry = useMemo(
    () => triangleFanGeometry(piece.triangles),
    [piece.triangles],
  );

  return (
    <mesh name={encodeMeshName(piece.selection)} geometry={geometry}>
      <meshStandardMaterial color={color} side={FrontSide} />
    </mesh>
  );
}
