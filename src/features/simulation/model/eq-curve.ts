// src/features/simulation/model/eq-curve.ts — la curva que dibujaría un ecualizador paramétrico.
//
// El motor entrega los filtros como cifras sueltas (banda, ganancia, Q) porque eso es lo que se
// teclea en un equipo. Un operador NO lee eso: lee una curva. Aquí se convierte lo uno en lo otro.
//
// Biquad peaking de la Audio EQ Cookbook (Robert Bristow-Johnson), que es la forma que implementan
// los ecualizadores paramétricos reales — por eso la curva coincide con lo que el operador verá en
// su plugin, y no es una interpolación bonita entre puntos.
//
// Los filtros en cascada se SUMAN en dB porque sus magnitudes se multiplican: dos campanas que se
// solapan no dan la mayor de las dos, dan más que cualquiera de ellas. Interpolar entre las bandas
// se saltaría justo eso, que es lo que hace falta ver para decidir si dos correcciones se pisan.
//
// fs es de dibujo, no del motor: 48 kHz es la de un sistema de directo y la deformación del biquad
// digital cerca de Nyquist es la misma que tendrá el equipo real.

const SAMPLE_RATE_HZ = 48_000;

/**
 * Los cinco tipos de la Cookbook que un paramétrico ofrece. El motor solo emite campanas —corrige
 * por bandas de octava enteras—, pero el asesor de mezcla propone también shelves y cortes, y
 * dibujar un pasa-altos como campana enseñaría una curva que el equipo no hace.
 */
export const EQ_FILTER_TYPES = [
  "peak",
  "low_shelf",
  "high_shelf",
  "high_pass",
  "low_pass",
] as const;

export type EqFilterType = (typeof EQ_FILTER_TYPES)[number];

export type EqBand = {
  frequencyHz: number;
  gainDb: number;
  /** Ancho de la campana. El motor manda 1.41 ≈ una octava. */
  q: number;
  /** Ausente = campana, que es lo único que manda el motor. */
  filterType?: EqFilterType;
};

export type EqPoint = { frequencyHz: number; gainDb: number };

export type EqCurveRange = {
  fromHz?: number;
  toHz?: number;
  /** Muestras log-espaciadas. 96 da una curva lisa a cualquier ancho de tarjeta. */
  points?: number;
};

/** Respuesta combinada de los filtros, muestreada en frecuencias log-espaciadas. */
export function eqCurve(
  bands: readonly EqBand[],
  range: EqCurveRange = {},
): EqPoint[] {
  const { fromHz = 20, toHz = 20_000, points = 96 } = range;
  const usable = bands.filter((band) => band.q > 0 && band.frequencyHz > 0);

  const step = Math.log10(toHz / fromHz) / (points - 1);
  return Array.from({ length: points }, (_, index) => {
    const frequencyHz = fromHz * 10 ** (step * index);
    return { frequencyHz, gainDb: gainAt(usable, frequencyHz) };
  });
}

/** Ganancia combinada en UNA frecuencia. Expuesta para asertar la curva sin muestrearla entera. */
export function gainAt(bands: readonly EqBand[], frequencyHz: number): number {
  return bands.reduce(
    (total, band) => total + bandGainDb(band, frequencyHz),
    0,
  );
}

function bandGainDb(band: EqBand, frequencyHz: number): number {
  const type = band.filterType ?? "peak";

  // Un corte no tiene ganancia: atenúa a un lado de su frecuencia valga lo que valga gainDb. Salir
  // temprano con 0 dB —correcto para campanas y shelves— lo dejaría dibujado como si no hiciera nada.
  if (band.gainDb === 0 && type !== "high_pass" && type !== "low_pass")
    return 0;

  const w0 = (2 * Math.PI * band.frequencyHz) / SAMPLE_RATE_HZ;
  const [numerator, denominator] = coefficients(
    type,
    10 ** (band.gainDb / 40),
    Math.sin(w0) / (2 * band.q),
    Math.cos(w0),
  );

  const w = (2 * Math.PI * frequencyHz) / SAMPLE_RATE_HZ;
  return 20 * Math.log10(magnitude(numerator, w) / magnitude(denominator, w));
}

type Biquad = { b0: number; b1: number; b2: number };

/** Coeficientes [numerador, denominador] de la Cookbook. a0 no se normaliza: se va en el cociente. */
function coefficients(
  type: EqFilterType,
  a: number,
  alpha: number,
  cosW0: number,
): [Biquad, Biquad] {
  const pole: Biquad = { b0: 1 + alpha, b1: -2 * cosW0, b2: 1 - alpha };

  switch (type) {
    case "low_shelf":
    case "high_shelf":
      return shelf(type, a, alpha, cosW0);
    case "high_pass":
      return [
        { b0: (1 + cosW0) / 2, b1: -(1 + cosW0), b2: (1 + cosW0) / 2 },
        pole,
      ];
    case "low_pass":
      return [
        { b0: (1 - cosW0) / 2, b1: 1 - cosW0, b2: (1 - cosW0) / 2 },
        pole,
      ];
    default:
      return [
        { b0: 1 + alpha * a, b1: -2 * cosW0, b2: 1 - alpha * a },
        { b0: 1 + alpha / a, b1: -2 * cosW0, b2: 1 - alpha / a },
      ];
  }
}

function shelf(
  type: "low_shelf" | "high_shelf",
  a: number,
  alpha: number,
  cosW0: number,
): [Biquad, Biquad] {
  const slope = 2 * Math.sqrt(a) * alpha;
  // El shelf alto es el bajo con el signo del coseno cambiado: misma fórmula, espejada en frecuencia.
  const s = type === "low_shelf" ? -1 : 1;

  return [
    {
      b0: a * (a + 1 + s * (a - 1) * cosW0 + slope),
      b1: -2 * s * a * (a - 1 + s * (a + 1) * cosW0),
      b2: a * (a + 1 + s * (a - 1) * cosW0 - slope),
    },
    {
      b0: a + 1 - s * (a - 1) * cosW0 + slope,
      b1: 2 * s * (a - 1 - s * (a + 1) * cosW0),
      b2: a + 1 - s * (a - 1) * cosW0 - slope,
    },
  ];
}

/** |b0 + b1·e^(-jw) + b2·e^(-2jw)| */
function magnitude(coefficients: Biquad, w: number): number {
  const { b0, b1, b2 } = coefficients;
  const real = b0 + b1 * Math.cos(w) + b2 * Math.cos(2 * w);
  const imaginary = -(b1 * Math.sin(w) + b2 * Math.sin(2 * w));

  return Math.hypot(real, imaginary);
}
