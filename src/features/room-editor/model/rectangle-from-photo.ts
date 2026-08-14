// src/features/room-editor/model/rectangle-from-photo.ts — la proporción de un rectángulo visto en
// perspectiva.
//
// QUÉ SE PUEDE Y QUÉ NO. La app de medición del iPhone usa LiDAR y ARKit; el navegador no expone ni
// una cosa ni la otra. Tocar cuatro esquinas en una foto da PÍXELES, y de píxeles solos no salen
// metros: la misma imagen la produce una sala pequeña de cerca y una grande de lejos. Lo que sí
// tiene solución cerrada es la PROPORCIÓN —cuántas veces es más largo que ancho—, y con una sola
// medida real del usuario esa proporción se convierte en las dos dimensiones.
//
// El método es el de Zhang y He (Whiteboard Scanning and Image Enhancement, 2006, §2). La idea:
// los dos pares de lados del rectángulo dan dos puntos de fuga, y como en la sala esas direcciones
// son perpendiculares, esa perpendicularidad es una ecuación que despeja la distancia focal. Con la
// focal, comparar la longitud de los dos lados en el plano de la sala ya es directo.
//
// TRAMPA QUE COSTÓ DOS TESTS: la ecuación se cae si la foto es SIMÉTRICA —de pie en el centro del
// muro, encarando la sala—, que es justo como sale la foto fácil. Ahí un par de lados no converge,
// su punto de fuga se va al infinito y la perpendicularidad deja de decir nada sobre la focal. No
// hay forma de sacarla de la imagen: se supone la de un móvil corriente y se avisa de que el
// resultado es más basto. Tomar la foto desde una ESQUINA es lo que devuelve la solución exacta.
//
// APROXIMADO también por lo demás, y hay que decirlo en pantalla: el método supone píxeles
// cuadrados, sin distorsión de barril y el punto principal en el centro del sensor. Ninguna se
// cumple del todo en la cámara de un teléfono. Sirve para partir de una planta parecida y
// corregirla a mano, no para levantar un plano de obra.

import type {
  Point2d,
  Polygon2d,
} from "@/features/room-editor/schemas/room-document";

/**
 * Un punto de fuga a más de veinte diagonales de imagen es, a efectos de cuentas, el infinito: su
 * posición la fija el ruido de dónde tocó el dedo, no la perspectiva.
 */
const FAR_VANISHING_DIAGONALS = 20;

/**
 * Focal supuesta cuando la imagen no la revela, como fracción del ancho. 0.75 corresponde a unos
 * 67° de campo horizontal, que es la cámara principal de un móvil corriente (~26 mm equivalentes).
 */
const ASSUMED_FOCAL_PER_WIDTH = 0.75;

type Vec3 = [number, number, number];

export type AspectEstimate = {
  /** Cuántas veces mide el lado 1→2 respecto al lado 1→4. Siempre positivo. */
  widthOverDepth: number;
  /**
   * La focal se supuso en vez de despejarse: la foto no traía la perspectiva necesaria. El
   * resultado sigue sirviendo, pero es más basto y la pantalla lo dice.
   */
  assumedFocal: boolean;
};

/**
 * `quad` son las cuatro esquinas TOCADAS EN ORDEN alrededor del piso. La correspondencia con el
 * artículo no es la del recorrido: allí m1m2 y m3m4 son los dos lados paralelos, así que el tercer
 * y el cuarto punto van cruzados.
 */
export function estimateAspectRatio(
  quad: readonly Point2d[],
  imageWidthPx: number,
  imageHeightPx: number,
): AspectEstimate | null {
  if (quad.length !== 4 || imageWidthPx <= 0 || imageHeightPx <= 0) return null;

  const [p0, p1, p2, p3] = quad;
  const m1: Vec3 = [p0[0], p0[1], 1];
  const m2: Vec3 = [p1[0], p1[1], 1];
  const m3: Vec3 = [p3[0], p3[1], 1];
  const m4: Vec3 = [p2[0], p2[1], 1];

  const k2Denominator = dot(cross(m2, m4), m3);
  const k3Denominator = dot(cross(m3, m4), m2);
  if (k2Denominator === 0 || k3Denominator === 0) return null;

  const k2 = dot(cross(m1, m4), m3) / k2Denominator;
  const k3 = dot(cross(m1, m4), m2) / k3Denominator;

  // Centrados en el punto principal: a partir de aquí la cámara es diag(1, 1, f²)/f².
  const u0 = imageWidthPx / 2;
  const v0 = imageHeightPx / 2;
  const v2 = centre(subtract(scale(m2, k2), m1), u0, v0);
  const v3 = centre(subtract(scale(m3, k3), m1), u0, v0);

  const diagonalPx = Math.hypot(imageWidthPx, imageHeightPx);
  const solved =
    isFinitePoint(v2, diagonalPx) && isFinitePoint(v3, diagonalPx)
      ? solveFocalSquared(v2, v3)
      : null;

  const assumedFocal = solved === null;
  const focalSquared = solved ?? (ASSUMED_FOCAL_PER_WIDTH * imageWidthPx) ** 2;

  // Vale para los tres casos: con los dos puntos de fuga finitos es la solución exacta, y cuando la
  // foto es frontal del todo (v2[2] = v3[2] = 0) la focal se cancela y queda la proporción plana,
  // que ahí es la buena.
  const ratio = Math.sqrt(
    lengthSquared(v2, focalSquared) / lengthSquared(v3, focalSquared),
  );
  return Number.isFinite(ratio) && ratio > 0
    ? { widthOverDepth: ratio, assumedFocal }
    : null;
}

/** Perpendicularidad de las dos direcciones: (v2·v3)/f² + v2z·v3z = 0. Null si no despeja. */
function solveFocalSquared(v2: Vec3, v3: Vec3): number | null {
  const denominator = v2[2] * v3[2];
  if (denominator === 0) return null;

  const focalSquared = -(v2[0] * v3[0] + v2[1] * v3[1]) / denominator;
  // f² ≤ 0 significa que esos cuatro puntos no pueden ser un rectángulo bajo este modelo de cámara:
  // casi siempre, un toque mal puesto.
  return focalSquared > 0 ? focalSquared : null;
}

/** ‖A⁻¹v‖²: lo que mide ese lado en el plano de la sala, salvo un factor común a los dos. */
function lengthSquared(v: Vec3, focalSquared: number): number {
  return (v[0] * v[0] + v[1] * v[1]) / focalSquared + v[2] * v[2];
}

/** Si el punto de fuga está lo bastante cerca como para que su posición signifique algo. */
function isFinitePoint(v: Vec3, diagonalPx: number): boolean {
  return (
    Math.abs(v[2]) * FAR_VANISHING_DIAGONALS * diagonalPx >
    Math.hypot(v[0], v[1])
  );
}

function centre(v: Vec3, u0: number, v0: number): Vec3 {
  return [v[0] - u0 * v[2], v[1] - v0 * v[2], v[2]];
}

/**
 * La planta rectangular que se importa, centrada en el origen y en sentido antihorario — que es lo
 * que el contrato exige y lo que `setFootprint` normalizaría de todos modos.
 */
export function rectangleFootprint(widthM: number, depthM: number): Polygon2d {
  const halfWidth = widthM / 2;
  const halfDepth = depthM / 2;

  return [
    [-halfWidth, -halfDepth],
    [halfWidth, -halfDepth],
    [halfWidth, halfDepth],
    [-halfWidth, halfDepth],
  ];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function scale(a: Vec3, factor: number): Vec3 {
  return [a[0] * factor, a[1] * factor, a[2] * factor];
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
