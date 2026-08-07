// src/features/room-3d/components/geometry-builders.ts — construye BufferGeometry de three.js a
// partir de los puntos puros que calcula model/extrude-room.ts. Vive en components/ y no en model/
// porque depende de three.js; model/ se mantiene testeable con Vitest puro, sin WebGL de por medio.

import * as THREE from "three";
import type { Point3d } from "@/features/room-3d/model/extrude-room";

export function quadGeometry(
  corners: readonly [Point3d, Point3d, Point3d, Point3d],
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(corners.flat(), 3),
  );
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
}

/** Un punto cada ~11°: el borde se lee redondo sin engordar el render. */
const CONE_SEGMENTS = 32;

/**
 * Cono de sección ELÍPTICA con el vértice en el origen y el eje sobre +x, que es el eje de tiro
 * local de una caja (ver speaker-orientation.ts). Los semiejes van sobre +z (horizontal, porque la
 * planta es el plano XZ en three.js) y sobre +y (vertical).
 *
 * Sin tapa al fondo: el cono no termina en ningún sitio físico, la longitud es una convención de
 * dibujo, y cerrarlo con un disco lo haría parecer un volumen.
 */
export function ellipticalConeGeometry(
  horizontalRadiusM: number,
  verticalRadiusM: number,
  throwM: number,
): THREE.BufferGeometry {
  const positions: number[] = [];

  for (let segment = 0; segment < CONE_SEGMENTS; segment++) {
    const from = (segment / CONE_SEGMENTS) * Math.PI * 2;
    const to = ((segment + 1) / CONE_SEGMENTS) * Math.PI * 2;

    positions.push(
      0,
      0,
      0,
      throwM,
      verticalRadiusM * Math.sin(from),
      horizontalRadiusM * Math.cos(from),
      throwM,
      verticalRadiusM * Math.sin(to),
      horizontalRadiusM * Math.cos(to),
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.computeVertexNormals();
  return geometry;
}

export function triangleFanGeometry(
  triangles: readonly (readonly [Point3d, Point3d, Point3d])[],
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = triangles.flatMap((triangle) => triangle.flat());
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.computeVertexNormals();
  return geometry;
}
