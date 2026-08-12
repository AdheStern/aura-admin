// src/features/room-3d/components/coverage-mesh.tsx — por dónde sale la energía de una caja: el
// lóbulo H×V si es direccional, una esfera si radia por igual en todas las direcciones.
//
// No captura clicks (raycast=null): la forma es grande y transparente, y si compitiera con las
// mallas del recinto taparía el picking de la pared que hay detrás.
//
// Ámbar, el mismo de la chapa frontal (speaker-baffle.tsx): en esta escena el ámbar significa "por
// aquí sale el sonido", y esta forma es la continuación de esa cara. Ya no hereda el color del
// cuerpo — con el azul de selección se confundía con la caja elegida, y con el gris del cuerpo se
// perdía contra los muros.

"use client";

import { useMemo } from "react";
import { DoubleSide } from "three";
import { ellipticalConeGeometry } from "@/features/room-3d/components/geometry-builders";
import type { CoverageShape } from "@/features/room-3d/model/coverage-shape";

const COVERAGE_HEX = "#f59e0b";

/** Muy translúcido a propósito: incluso a media sala esto es un volumen grande y taparía lo que se
 *  está mirando para decidir dónde va la caja. Sube al elegirla, para separarla de las demás. */
const IDLE_OPACITY = 0.07;
const SELECTED_OPACITY = 0.16;

/** Un punto cada ~11° en horizontal, la misma resolución que el cono. */
const SPHERE_SEGMENTS = 32;

const NO_RAYCAST = () => null;

export function CoverageMesh({
  shape,
  isSelected,
}: {
  shape: CoverageShape;
  isSelected: boolean;
}) {
  if (shape.kind === "sphere") {
    return (
      <mesh raycast={NO_RAYCAST}>
        <sphereGeometry
          args={[shape.radiusM, SPHERE_SEGMENTS, SPHERE_SEGMENTS / 2]}
        />
        <CoverageMaterial isSelected={isSelected} />
      </mesh>
    );
  }

  return <ConeMesh cone={shape} isSelected={isSelected} />;
}

function ConeMesh({
  cone,
  isSelected,
}: {
  cone: Extract<CoverageShape, { kind: "cone" }>;
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
    <mesh geometry={geometry} raycast={NO_RAYCAST}>
      <CoverageMaterial isSelected={isSelected} />
    </mesh>
  );
}

function CoverageMaterial({ isSelected }: { isSelected: boolean }) {
  return (
    <meshBasicMaterial
      color={COVERAGE_HEX}
      side={DoubleSide}
      transparent
      opacity={isSelected ? SELECTED_OPACITY : IDLE_OPACITY}
      depthWrite={false}
    />
  );
}
