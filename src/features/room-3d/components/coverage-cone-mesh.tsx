// src/features/room-3d/components/coverage-cone-mesh.tsx — el lóbulo H×V de una caja.
// No captura clicks (raycast=null): el cono es grande y transparente, y si compitiera con las
// mallas del recinto taparía el picking de la pared que hay detrás.

"use client";

import { useMemo } from "react";
import { DoubleSide } from "three";
import { ellipticalConeGeometry } from "@/features/room-3d/components/geometry-builders";
import type { CoverageCone } from "@/features/room-3d/model/coverage-cone";

export function CoverageConeMesh({
  cone,
  color,
  isSelected,
}: {
  cone: CoverageCone;
  color: string;
  isSelected: boolean;
}) {
  const geometry = useMemo(
    () =>
      ellipticalConeGeometry(
        cone.horizontalRadiusM,
        cone.verticalRadiusM,
        cone.throwM,
      ),
    [cone.horizontalRadiusM, cone.verticalRadiusM, cone.throwM],
  );

  return (
    <mesh geometry={geometry} raycast={() => null}>
      <meshBasicMaterial
        color={color}
        side={DoubleSide}
        transparent
        // Muy translúcido a propósito: un cono de 90° es tan ancho como largo y taparía la sala
        // entera, que es justo lo que se está mirando para decidir dónde va la caja.
        opacity={isSelected ? 0.16 : 0.07}
        depthWrite={false}
      />
    </mesh>
  );
}
