// prisma/seed/derive.ts — reglas de derivación del seed, todas en un solo sitio.
// Las fichas de fabricante no publican todo lo que los contratos exigen (curvas tabuladas,
// scattering, sensibilidad). En vez de inventar cifras ítem a ítem, cada campo ausente se deriva
// con una regla explícita y trazable que se aplica igual a todos. Nada de esto sustituye a la
// revisión humana: el seed entra con verified:false y el roadmap la exige (Fase 1, "+ revisión
// humana"). El campo dataSource de cada ítem declara qué reglas se le aplicaron.

import type { OctaveBandKey } from "../../src/contracts/bands";
import { OCTAVE_BAND_KEYS } from "../../src/contracts/bands";

/** Media geométrica: el centro "real" de un rango de frecuencias, que se lee en escala log. */
function geometricMean(low: number, high: number): number {
  return Math.round(Math.sqrt(low * high));
}

/**
 * Curva de respuesta de un parlante reconstruida desde los dos rangos que publica la ficha.
 * Afirma exactamente lo que el fabricante afirma y ni un dato más: −10 dB en los extremos del
 * rango amplio, −3 dB en los del rango estrecho y plano en el centro. El motor extrapola fuera
 * de rangeHz a −12 dB/octava (Apéndice A.3), así que no hace falta inventar nada más allá.
 */
export function curveFromRanges(
  range10: [number, number],
  range3: [number, number],
): [number, number][] {
  const points: [number, number][] = [];

  // Cuando el fabricante declara el mismo extremo para ambas tolerancias (p. ej. PRX908, que corta
  // a 20 kHz tanto a −3 como a −10 dB) el punto de −10 se omite: emitir los dos haría que la curva
  // afirmara dos niveles distintos a la misma frecuencia. Manda el −3 dB, que es la afirmación
  // más fuerte de las dos.
  if (range10[0] < range3[0]) points.push([range10[0], -10]);
  points.push([range3[0], -3]);
  points.push([geometricMean(range3[0], range3[1]), 0]);
  points.push([range3[1], -3]);
  if (range10[1] > range3[1]) points.push([range10[1], -10]);

  return points;
}

/**
 * Curva de un micrófono: las fichas publican un solo rango, sin tolerancia asociada. Se toma
 * el criterio conservador (extremos a −10 dB) en vez de asumir que el rango es el de ±3 dB.
 */
export function curveFromSingleRange(
  range: [number, number],
): [number, number][] {
  return [
    [range[0], -10],
    [geometricMean(range[0], range[1]), 0],
    [range[1], -10],
  ];
}

/**
 * Sensibilidad a 1 W / 1 m invertida desde el SPL máximo y la potencia que lo produce:
 * maxSPL = sensibilidad + 10·log₁₀(P). No es una estimación de tanteo, es la misma relación
 * física que el motor usa al revés para calcular el campo directo.
 */
export function sensitivityFromMaxSpl(
  maxSplDb: number,
  continuousW: number,
): number {
  return Math.round((maxSplDb - 10 * Math.log10(continuousW)) * 10) / 10;
}

/**
 * Reparto AES de potencia cuando la ficha solo publica el pico: programa = pico/2,
 * continua = pico/4. Se usa solo donde falta el dato; si la ficha trae los tres, mandan ellos.
 */
export function powerFromPeak(peakW: number): {
  continuousW: number;
  programW: number;
  peakW: number;
} {
  return { continuousW: peakW / 4, programW: peakW / 2, peakW };
}

/** Factor de cresta: el SPL continuo queda 3 dB por debajo del pico publicado. */
export function continuousFromPeakSpl(peakDb: number): number {
  return Math.round((peakDb - 3) * 10) / 10;
}

/**
 * NRC según la definición del doc maestro (Sección 4.2): promedio de 250–2000 Hz redondeado
 * al múltiplo de 0.05 más cercano. Se calcula siempre — nunca se transcribe a mano.
 */
export function nrcFrom(absorption: Record<OctaveBandKey, number>): number {
  const bands: OctaveBandKey[] = ["250", "500", "1000", "2000"];
  const mean = bands.reduce((sum, b) => sum + absorption[b], 0) / bands.length;
  return Math.round(mean / 0.05) * 0.05;
}

// ---------------------------------------------------------------------------------------------
// Scattering por familia de superficie
// ---------------------------------------------------------------------------------------------
// El contrato exige s en las seis bandas y el motor lo consume, pero NINGUNA tabla de absorción
// publica scattering: se mide con ISO 17497, en otro ensayo. El doc maestro tampoco fija de dónde
// sacarlo (hueco documentado en la Sección 4.2 al hacer este seed).
//
// Física: s es la fracción de energía reflejada que se dispersa fuera del ángulo especular, y
// depende del tamaño del relieve de la superficie frente a la longitud de onda. Por eso todos los
// perfiles suben con la frecuencia: a 4 kHz (λ≈8.5 cm) una textura de centímetros ya dispersa,
// a 125 Hz (λ≈2.7 m) esa misma textura es invisible y la superficie se comporta como un espejo.
//
// El perfil `lisa` reproduce exactamente el ejemplo del doc (ladrillo visto pintado) y ancla la
// escala de los demás. Son valores de referencia de modelado, no medidas: la revisión humana los
// corrige por material donde exista ensayo real.

export type ScatteringProfile =
  | "lisa"
  | "texturada"
  | "porosa"
  | "plegada"
  | "audiencia";

const SCATTERING_PROFILES: Record<ScatteringProfile, number[]> = {
  // Vidrio, yeso liso, hormigón pulido, linóleo: relieve muy por debajo de toda λ audible.
  lisa: [0.05, 0.05, 0.1, 0.1, 0.15, 0.15],
  // Bloque de hormigón visto, ladrillo, madera con junta: relieve de centímetros.
  texturada: [0.1, 0.1, 0.15, 0.2, 0.25, 0.3],
  // Paneles acústicos y alfombra: superficie fibrosa, pero absorbe más de lo que dispersa.
  porosa: [0.1, 0.15, 0.2, 0.25, 0.3, 0.35],
  // Cortinas con pliegues: el pliegue mide decenas de cm y dispersa desde media frecuencia.
  plegada: [0.15, 0.25, 0.35, 0.45, 0.5, 0.5],
  // Público sentado: la superficie más difusora de una sala, cuerpos y butacas irregulares.
  audiencia: [0.4, 0.5, 0.6, 0.7, 0.7, 0.7],
};

export function scatteringFor(
  profile: ScatteringProfile,
): Record<OctaveBandKey, number> {
  const values = SCATTERING_PROFILES[profile];
  return Object.fromEntries(
    OCTAVE_BAND_KEYS.map((band, i) => [band, values[i]]),
  ) as Record<OctaveBandKey, number>;
}

/**
 * Seis valores en orden de banda → el record que exige el contrato. Los datasets se escriben como
 * arrays para que se lean como la tabla que son; esta función es el único sitio que conoce el orden.
 */
export function byBand(values: number[]): Record<OctaveBandKey, number> {
  if (values.length !== OCTAVE_BAND_KEYS.length) {
    throw new Error(
      `Se esperaban ${OCTAVE_BAND_KEYS.length} bandas, llegaron ${values.length}`,
    );
  }
  return Object.fromEntries(
    OCTAVE_BAND_KEYS.map((band, i) => [band, values[i]]),
  ) as Record<OctaveBandKey, number>;
}
