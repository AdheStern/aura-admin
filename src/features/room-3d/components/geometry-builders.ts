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
