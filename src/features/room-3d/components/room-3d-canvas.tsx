// src/features/room-3d/components/room-3d-canvas.tsx — el lienzo R3F: cámara orbital encuadrada
// sobre la sala (§5.3 pide "cámara" sin más detalle; frameCamera fija un encuadre razonable a
// partir del footprint) y la malla extruida con su picking.

"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useTheme } from "next-themes";
import { FloorGrid } from "@/features/room-3d/components/floor-grid";
import { RoomMesh } from "@/features/room-3d/components/room-mesh";
import { SpeakerRig } from "@/features/room-3d/components/speaker-rig";
import { SplOverlayMesh } from "@/features/room-3d/components/spl-overlay-mesh";
import { ZoneMeshes } from "@/features/room-3d/components/zone-meshes";
import { frameCamera } from "@/features/room-3d/model/frame-camera";
import { canvasPalette } from "@/features/room-editor/model/canvas-palette";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";
import type { SplOverlay } from "@/features/simulation/queries/get-latest-spl-grid";

/** Justo antes de la horizontal: evita que OrbitControls meta la cámara bajo el piso. */
const MAX_POLAR_ANGLE = Math.PI / 2 - 0.02;

export function Room3dCanvas({
  overlay,
}: {
  /** null cuando la escena no tiene ninguna simulación completada, o el mapa está apagado. */
  overlay: SplOverlay | null;
}) {
  const document = useRoomStore((state) => state.document);
  const select = useRoomStore((state) => state.select);
  const { targetM, radiusM, positionM } = frameCamera(
    document.footprint.vertices,
    document.height.h,
  );

  // El tema se resuelve AQUÍ, fuera del árbol de R3F, y la paleta baja como prop: dentro del lienzo
  // se dibuja con three.js, que no lee custom properties CSS ni clases de Tailwind.
  const { resolvedTheme } = useTheme();
  const palette = canvasPalette(resolvedTheme === "dark" ? "dark" : "light");

  return (
    <Canvas
      className="flex-1"
      camera={{ position: positionM, fov: 50 }}
      // Clic al vacío = deseleccionar, igual que en el lienzo 2D. R3F solo lo dispara si el puntero
      // apenas se movió, así que soltar el botón tras orbitar no deselecciona nada.
      onPointerMissed={() => select(null)}
    >
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[radiusM, radiusM * 2, radiusM]}
        intensity={0.9}
      />
      <FloorGrid palette={palette} radiusM={radiusM} />
      <RoomMesh />
      {/* Después del recinto: son translúcidas y tienen que mezclarse con lo que ya se pintó. */}
      <ZoneMeshes palette={palette} />
      {overlay ? <SplOverlayMesh overlay={overlay} /> : null}
      <SpeakerRig />
      {/* makeDefault es lo que deja que TransformControls congele el orbitar mientras se arrastra
          un gizmo; sin él la cámara gira a la vez que la caja y no hay forma de colocar nada. */}
      <OrbitControls
        makeDefault
        target={targetM}
        minDistance={radiusM * 0.2}
        maxDistance={radiusM * 4}
        maxPolarAngle={MAX_POLAR_ANGLE}
      />
    </Canvas>
  );
}
