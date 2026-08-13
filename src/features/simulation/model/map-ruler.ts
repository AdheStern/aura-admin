// src/features/simulation/model/map-ruler.ts — las marcas de la regla del mapa en planta.
//
// La regla mide DESDE LA ESQUINA DEL RECINTO, no en coordenadas del mundo. El editor coloca la
// planta donde le toque, así que una sala que va de x=4 a x=16 rotulaba "4, 6, 8…" en horizontal
// mientras que en vertical, de y=0 a y=8, rotulaba "0, 2, 4…": dos ejes contando desde sitios
// distintos por un motivo que no se ve en pantalla. Una cinta métrica se apoya en la pared y empieza
// en cero, y eso es lo que se lee sin tener que preguntar.
//
// El paso no es fijo: una sala de 6 m y una nave de 40 m necesitan marcas distintas o acaban con
// dos marcas o con cuarenta. Se elige el "número redondo" (1, 2, 5, 10 y sus múltiplos de diez) más
// cercano a repartir el lado en ocho tramos, que es la densidad que se lee sin amontonarse.
//
// Las posiciones salen en PORCENTAJE del lado dibujado, no en píxeles: el SVG del mapa lleva su
// viewBox en metros y se estira al ancho del contenedor, así que un porcentaje cae siempre sobre el
// mismo metro pase lo que pase con el tamaño de la pantalla. En píxeles habría que medir el DOM.
//
// Por eso hay que pasarle las dos cosas: dónde empieza el RECINTO —el cero de la cinta— y dónde
// empieza lo DIBUJADO, que lleva un metro de aire alrededor. Confundirlas corre la regla justo ese
// metro.

/** Tramos a los que se aspira. Ocho da entre cinco y nueve marcas en la mayoría de recintos. */
const TARGET_DIVISIONS = 8;

const NICE_MULTIPLES = [1, 2, 5, 10] as const;

export type RulerTick = {
  /** Metros desde la esquina del recinto, que es lo que se rotula. */
  valueM: number;
  /** 0 = el borde inferior o izquierdo de lo DIBUJADO, 100 = el opuesto. */
  positionPct: number;
};

export type RulerSpan = {
  /** Dónde empieza el recinto en este eje: el cero de la cinta. */
  originM: number;
  /** Lo que mide el recinto en este eje. */
  lengthM: number;
  /** Dónde empieza lo dibujado, que incluye el aire de alrededor. */
  drawnMinM: number;
  /** Lo que mide lo dibujado. */
  drawnLengthM: number;
};

export function niceStepM(lengthM: number): number {
  if (!(lengthM > 0)) return 1;

  const target = lengthM / TARGET_DIVISIONS;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  const multiple =
    NICE_MULTIPLES.find((candidate) => candidate * magnitude >= target) ?? 10;

  return multiple * magnitude;
}

/**
 * Marcas de 0 a lo que mida el recinto, colocadas sobre lo dibujado.
 *
 * El último tramo suele quedar corto —una sala de 12.4 m con paso de 2 acaba rotulada en 12— y así
 * es como se comporta una cinta: se rotula la marca, no el final de la pared.
 */
export function rulerTicks(span: RulerSpan): RulerTick[] {
  const { originM, lengthM, drawnMinM, drawnLengthM } = span;
  if (!(lengthM > 0) || !(drawnLengthM > 0)) return [];

  const step = niceStepM(lengthM);
  const ticks: RulerTick[] = [];

  for (let value = 0; value <= lengthM + 1e-9; value += step) {
    // El redondeo evita que la suma repetida arrastre 0.30000000000000004 hasta la etiqueta.
    const valueM = Number(value.toFixed(6));
    ticks.push({
      valueM,
      positionPct: ((originM + valueM - drawnMinM) / drawnLengthM) * 100,
    });
  }

  return ticks;
}

/** Sin decimales cuando no hacen falta: "4 m" se lee antes que "4.0 m". */
export function formatMetres(valueM: number): string {
  return Number.isInteger(valueM) ? `${valueM}` : valueM.toFixed(1);
}
