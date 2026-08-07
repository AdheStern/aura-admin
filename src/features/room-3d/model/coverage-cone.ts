// src/features/room-3d/model/coverage-cone.ts — el cono de cobertura H×V que §5.3 pide ver.
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

export type CoverageCone = {
  /** Semiejes de la elipse en el extremo del cono, en metros. */
  horizontalRadiusM: number;
  verticalRadiusM: number;
  /** Longitud del cono desde la caja. */
  throwM: number;
};

/** Un cono más corto que esto no se ve en una sala grande; también cubre la sala sin planta. */
const MIN_THROW_M = 2;

/**
 * Hasta dónde se dibuja: la esquina más lejana de la planta. El cono no tiene alcance físico (la
 * energía no se acaba), así que la longitud es una convención de dibujo — llegar al fondo de la
 * sala es la que deja ver si la caja cubre el fondo o se queda corta.
 */
export function coneThrowM(
  positionXY: readonly [number, number],
  footprint: Polygon2d,
): number {
  const distances = footprint.map(([x, y]) =>
    Math.hypot(x - positionXY[0], y - positionXY[1]),
  );
  return Math.max(MIN_THROW_M, ...distances);
}

/**
 * A partir de 180° en un plano la caja ya no tiene lóbulo: radia hacia todos lados. Los subgraves
 * del catálogo declaran 360°×360° justamente por eso, y su semiángulo tiende a la perpendicular —
 * la tangente se dispara y saldría un cono monstruoso que además mentiría, porque no hay dirección
 * privilegiada que mostrar. Se dice con palabras (ver speaker-panel.tsx) y no se dibuja.
 */
const OMNIDIRECTIONAL_FROM_DEG = 180;

export function coverageCone(
  spec: SpeakerSpec | null,
  throwM: number,
): CoverageCone | null {
  // Sin datasheet no hay cobertura que dibujar: inventar un ángulo por defecto sería exactamente la
  // clase de dato falso que el principio de "precisión honesta" prohíbe.
  if (!spec) return null;

  const { hDeg, vDeg } = spec.directivity.nominalCoverage;
  if (hDeg >= OMNIDIRECTIONAL_FROM_DEG || vDeg >= OMNIDIRECTIONAL_FROM_DEG) {
    return null;
  }

  return {
    horizontalRadiusM: radiusM(hDeg, throwM),
    verticalRadiusM: radiusM(vDeg, throwM),
    throwM,
  };
}

export function isOmnidirectional(spec: SpeakerSpec): boolean {
  const { hDeg, vDeg } = spec.directivity.nominalCoverage;
  return hDeg >= OMNIDIRECTIONAL_FROM_DEG || vDeg >= OMNIDIRECTIONAL_FROM_DEG;
}

/** Radio del cono a `throwM` del vértice para una cobertura TOTAL de `coverageDeg`. */
function radiusM(coverageDeg: number, throwM: number): number {
  return throwM * Math.tan((coverageDeg / 2) * (Math.PI / 180));
}
