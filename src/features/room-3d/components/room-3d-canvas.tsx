// src/features/room-3d/components/room-3d-canvas.tsx — el lienzo R3F: cámara orbital encuadrada
// sobre la sala (§5.3 pide "cámara" sin más detalle; frameCamera fija un encuadre razonable a
// partir del footprint) y la malla extruida con su picking.

"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { RoomMesh } from "@/features/room-3d/components/room-mesh";
import { frameCamera } from "@/features/room-3d/model/frame-camera";
import type { MaterialNrcById } from "@/features/room-3d/queries/list-room-material-colors";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

/** Justo antes de la horizontal: evita que OrbitControls meta la cámara bajo el piso. */
const MAX_POLAR_ANGLE = Math.PI / 2 - 0.02;

export function Room3dCanvas({
  materialColorsById,
}: {
  materialColorsById: MaterialNrcById;
}) {
  const document = useRoomStore((state) => state.document);
  const { targetM, radiusM, positionM } = frameCamera(
    document.footprint.vertices,
    document.height.h,
  );

  return (
    <Canvas className="flex-1" camera={{ position: positionM, fov: 50 }}>
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[radiusM, radiusM * 2, radiusM]}
        intensity={0.9}
      />
      <RoomMesh materialColorsById={materialColorsById} />
      <OrbitControls
        target={targetM}
        minDistance={radiusM * 0.2}
        maxDistance={radiusM * 4}
        maxPolarAngle={MAX_POLAR_ANGLE}
      />
    </Canvas>
  );
}
