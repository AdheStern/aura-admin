// src/features/room-3d/model/coverage-shape.ts — la forma que §5.3 pide ver: el lóbulo H×V de una
// caja direccional, o la burbuja de una que radia por igual hacia todos lados.
//
// FÍSICA: `directivity.nominalCoverage` es el ángulo TOTAL a −6 dB en cada plano (así lo interpreta
// el modelo normativo del Apéndice A.2 que implementa catalogs/directivity.ts), así que el
// semiángulo del cono es la mitad. Dibujar el ángulo completo como semiángulo pintaría una caja el
// doble de ancha de lo que cubre, que es justo el error que este comentario existe para evitar.
//
// La sección transversal es una ELIPSE, no un círculo: H y V son distintos en casi toda caja de
// refuerzo (90°×60° es lo corriente) y un cono de revolución no representaría eso.
//
// Es un MODELO, no una medida — el datasheet no publica la curva polar. La UI tiene que rotularlo
// igual que ya hace node-charts.tsx con los diagramas 2D.

import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";
import type { Polygon2d } from "@/features/room-editor/schemas/room-document";

export type CoverageShape =
  | {
      kind: "cone";
      /** Semiejes de la elipse en el extremo del cono, en metros. */
      horizontalRadiusM: number;
      verticalRadiusM: number;
      /** Longitud del cono desde la caja. */
      throwM: number;
    }
  | { kind: "sphere"; radiusM: number };

/** Una forma más corta que esto no se ve en una sala grande; también cubre la sala sin planta. */
const MIN_REACH_M = 2;

/**
 * Media distancia a la esquina más lejana. La cobertura no tiene alcance físico —la energía no se
 * acaba—, así que hasta dónde se dibuja es una convención.
 *
 * Antes se dibujaba hasta la esquina entera, para poder ver si la caja llegaba al fondo. Sale
 * inservible: un cono de 90° es tan ancho como largo, y a esa longitud llena la sala y tapa el
 * recinto, las zonas y las demás cajas — justo lo que se está mirando para decidir dónde va ésta.
 * A la mitad se sigue leyendo hacia dónde apunta y cuánto abre, que es para lo que sirve.
 */
const REACH_FRACTION = 0.5;

export function coverageReachM(
  positionXY: readonly [number, number],
  footprint: Polygon2d,
): number {
  const distances = footprint.map(([x, y]) =>
    Math.hypot(x - positionXY[0], y - positionXY[1]),
  );
  return Math.max(MIN_REACH_M, REACH_FRACTION * Math.max(0, ...distances));
}

/** La burbuja se dibuja con el DIÁMETRO del alcance, no con el radio: así ocupa lo mismo que llega
 *  el cono de una caja direccional puesta al lado, y las dos formas se leen a la misma escala. */
const SPHERE_REACH_FRACTION = 0.5;

export function coverageShape(
  spec: SpeakerSpec | null,
  reachM: number,
): CoverageShape | null {
  // Sin datasheet no hay cobertura que dibujar: inventar un ángulo por defecto sería exactamente la
  // clase de dato falso que el principio de "precisión honesta" prohíbe.
  if (!spec) return null;

  if (isOmnidirectional(spec)) {
    return { kind: "sphere", radiusM: reachM * SPHERE_REACH_FRACTION };
  }

  const { hDeg, vDeg } = spec.directivity.nominalCoverage;
  return {
    kind: "cone",
    horizontalRadiusM: radiusM(hDeg, reachM),
    verticalRadiusM: radiusM(vDeg, reachM),
    throwM: reachM,
  };
}

/** A partir de 180° en un plano la caja ya no tiene lóbulo: radia hacia todos lados. Los subgraves
 *  del catálogo declaran 360°×360° justamente por eso, y su semiángulo tiende a la perpendicular —
 *  la tangente se dispara y saldría un cono monstruoso que además mentiría, porque no hay dirección
 *  privilegiada que enseñar. De ahí la esfera: es la forma en la que realmente se propaga. */
const OMNIDIRECTIONAL_FROM_DEG = 180;

export function isOmnidirectional(spec: SpeakerSpec): boolean {
  const { hDeg, vDeg } = spec.directivity.nominalCoverage;
  return hDeg >= OMNIDIRECTIONAL_FROM_DEG || vDeg >= OMNIDIRECTIONAL_FROM_DEG;
}

/** Radio del cono a `reachM` del vértice para una cobertura TOTAL de `coverageDeg`. */
function radiusM(coverageDeg: number, reachM: number): number {
  return reachM * Math.tan((coverageDeg / 2) * (Math.PI / 180));
}
