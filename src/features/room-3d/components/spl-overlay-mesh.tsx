// src/features/room-3d/components/spl-overlay-mesh.tsx — la cobertura pintada sobre el recinto.
//
// La otra mitad del mapa de §5.4: misma escala fija de 70–110 dB que la vista cenital, así que un
// mapa y otro se leen igual y se pueden comparar de un vistazo.
//
// Va sobre el SUELO y no a la altura de oído, aunque los valores estén calculados a esa altura: es
// como lo presenta cualquier software de cobertura, y un plano flotando a 1.2 m cortaría las cajas
// y taparía media sala desde una cámara orbital.
//
// NearestFilter y no interpolación: el motor entregó un valor por celda, y suavizarlos dibujaría
// transiciones que nadie calculó. Es la misma decisión que el crispEdges del mapa 2D.

"use client";

import { useEffect, useMemo } from "react";
import { DataTexture, DoubleSide, NearestFilter, RGBAFormat } from "three";
import { buildSplRaster } from "@/features/room-3d/model/spl-texture";
import type { SplOverlay } from "@/features/simulation/queries/get-latest-spl-grid";

/** Justo encima del piso: a 0 el plano y el suelo pelean por el mismo píxel y parpadean. */
const HOVER_M = 0.02;

export function SplOverlayMesh({ overlay }: { overlay: SplOverlay }) {
  const raster = useMemo(
    () =>
      buildSplRaster(overlay.points, overlay.valuesDbA, overlay.resolutionM),
    [overlay],
  );

  const texture = useMemo(() => {
    if (!raster) return null;
    const created = new DataTexture(
      raster.data,
      raster.width,
      raster.height,
      RGBAFormat,
    );
    created.magFilter = NearestFilter;
    created.minFilter = NearestFilter;
    created.needsUpdate = true;
    return created;
  }, [raster]);

  // Una DataTexture reserva memoria de GPU que el recolector no libera solo.
  useEffect(() => () => texture?.dispose(), [texture]);

  if (!raster || !texture) return null;

  const [x, y] = raster.centerM;
  const [width, depth] = raster.sizeM;

  return (
    <mesh
      // El marco de la escena es Y-up (scene-frame.ts): la planta del contrato (x, y) es (x, z) de
      // three.js. Rotar +π/2 en X deja la v de la textura creciendo con la y del recinto, que es
      // como se escriben las filas del raster.
      position={[x, HOVER_M, y]}
      rotation={[Math.PI / 2, 0, 0]}
      // Sin raycast no roba clicks al suelo: el mapa se mira, no se selecciona.
      raycast={() => null}
    >
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial
        map={texture}
        transparent
        side={DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
