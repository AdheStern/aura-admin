// src/features/room-3d/components/obstacle-mesh.tsx — un pilar, de piso a techo (§5.3: sin CSG en
// v1, el pilar no resta volumen de la sala, solo se dibuja encima).

"use client";

import type { ObstaclePiece } from "@/features/room-3d/model/extrude-room";
import { encodeMeshName } from "@/features/room-3d/model/mesh-selection";

export function ObstacleMesh({
  piece,
  color,
}: {
  piece: ObstaclePiece;
  color: string;
}) {
  const [cx, cz] = piece.centerM;
  const position: [number, number, number] = [cx, piece.heightM / 2, cz];
  const name = encodeMeshName(piece.selection);

  if (piece.shape === "circle") {
    const [radiusM] = piece.sizeM;
    return (
      <mesh name={name} position={position}>
        <cylinderGeometry args={[radiusM, radiusM, piece.heightM, 24]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  }

  const [widthM, depthM] = piece.sizeM;
  return (
    <mesh name={name} position={position}>
      <boxGeometry args={[widthM, piece.heightM, depthM]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
