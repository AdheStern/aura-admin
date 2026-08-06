// src/features/catalogs/directivity.ts — patrones polares dibujables a partir de lo que el
// datasheet SÍ publica.
//
// Ni el micrófono ni el parlante traen la curva polar tabulada: MicrophoneSpec publica el nombre
// del patrón y SpeakerSpec la cobertura nominal en grados. Los dos diagramas se generan con los
// modelos de abajo, así que son MODELOS y no medidas — la UI tiene que decirlo, igual que el seed
// declara en dataSource qué transcribió y qué derivó.

import type { MicrophoneSpec } from "@/contracts/microphone-spec.schema";

export type PolarSample = { angleDeg: number; magnitude: number };

/** Un punto cada 5°: suficiente para que el lóbulo se lea redondo sin engordar el render. */
const ANGLE_STEP_DEG = 5;

// Familia de primer orden: r(θ) = A + B·cos θ con A + B = 1, que es como se describen todos los
// micrófonos de gradiente de presión. A es la parte omnidireccional y B la bidireccional; el
// reparto entre ambas es lo que da el nombre comercial del patrón.
// Los coeficientes son los clásicos: supercardioide maximiza la relación frente/espalda e
// hipercardioide maximiza el índice de directividad.
const FIRST_ORDER_COEFFICIENTS: Record<
  MicrophoneSpec["polarPattern"],
  { omni: number; bidirectional: number; order: number }
> = {
  omnidirectional: { omni: 1, bidirectional: 0, order: 1 },
  cardioid: { omni: 0.5, bidirectional: 0.5, order: 1 },
  supercardioid: { omni: 0.366, bidirectional: 0.634, order: 1 },
  hypercardioid: { omni: 0.25, bidirectional: 0.75, order: 1 },
  figure_8: { omni: 0, bidirectional: 1, order: 1 },
  // El cañón NO es de primer orden: su directividad viene de la interferencia en el tubo, no del
  // reparto omni/bidireccional. Se aproxima elevando un hipercardioide a una potencia, que
  // estrecha el lóbulo frontal sin inventar una física distinta. Es la aproximación más honesta
  // que permite el dato disponible, y por eso la UI lo rotula como modelo.
  shotgun: { omni: 0.25, bidirectional: 0.75, order: 3 },
};

/** Patrón polar normalizado (0–1) de un micrófono, en el plano horizontal. */
export function microphonePolarPattern(
  pattern: MicrophoneSpec["polarPattern"],
): PolarSample[] {
  const { omni, bidirectional, order } = FIRST_ORDER_COEFFICIENTS[pattern];

  return anglesDeg().map((angleDeg) => {
    const response = omni + bidirectional * Math.cos(toRadians(angleDeg));
    // Valor absoluto: el lóbulo trasero de un figura-8 suena, solo que en oposición de fase, y el
    // diagrama polar representa magnitud. La polaridad no se dibuja.
    return {
      angleDeg,
      magnitude: round(Math.abs(response) ** order),
    };
  });
}

/**
 * Cobertura de un parlante en un plano, según el modelo paramétrico NORMATIVO del Apéndice A.2:
 *
 *     A(θ) = 6 · (2θ / θ_cov)²  [dB]   →  por construcción A(θ_cov / 2) = 6 dB
 *
 * Es decir: la cobertura nominal es el ángulo TOTAL a −6 dB. El tope de 20 dB es el A_max que el
 * mismo apéndice fija para f ≥ 1 kHz; por debajo de 250 Hz la caja se vuelve omnidireccional y
 * este diagrama dejaría de aplicar, así que representa el comportamiento en agudos.
 */
export function speakerCoveragePattern(coverageDeg: number): PolarSample[] {
  return anglesDeg().map((angleDeg) => {
    const offAxisDeg = Math.abs(normalizeToHalfTurn(angleDeg));
    const attenuationDb = Math.min(
      (6 * (2 * offAxisDeg) ** 2) / coverageDeg ** 2,
      MAX_ATTENUATION_DB,
    );
    // De dB a magnitud de presión: el diagrama polar se dibuja en amplitud, no en potencia.
    return { angleDeg, magnitude: round(10 ** (-attenuationDb / 20)) };
  });
}

const MAX_ATTENUATION_DB = 20;

function anglesDeg(): number[] {
  return Array.from(
    { length: 360 / ANGLE_STEP_DEG },
    (_, index) => index * ANGLE_STEP_DEG,
  );
}

/** 350° es −10° fuera de eje, no 350° fuera de eje: la atenuación es simétrica. */
function normalizeToHalfTurn(angleDeg: number): number {
  return angleDeg > 180 ? angleDeg - 360 : angleDeg;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
