// src/features/room-3d/components/opening-overlay.tsx — una ventana o puerta: un quad superpuesto
// a su muro (§5.3, KISS de v1: no agujerea la malla, solo cambia el material de esa área).

"use client";

import { useMemo } from "react";
import { DoubleSide } from "three";
import { quadGeometry } from "@/features/room-3d/components/geometry-builders";
import type { OpeningPiece } from "@/features/room-3d/model/extrude-room";
import { encodeMeshName } from "@/features/room-3d/model/mesh-selection";

export function OpeningOverlay({
  piece,
  color,
}: {
  piece: OpeningPiece;
  color: string;
}) {
  const geometry = useMemo(() => quadGeometry(piece.corners), [piece.corners]);

  return (
    <mesh name={encodeMeshName(piece.selection)} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        side={DoubleSide}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}
