// src/features/simulation/model/map-ruler.ts — las marcas de la regla del mapa en planta.
//
// El paso no es fijo: una sala de 6 m y una nave de 40 m necesitan marcas distintas o acaban con
// dos marcas o con cuarenta. Se elige el "número redondo" (1, 2, 5, 10 y sus múltiplos de diez) más
// cercano a repartir el lado en ocho tramos, que es la densidad que se lee sin amontonarse.
//
// Las posiciones salen en PORCENTAJE del lado dibujado, no en píxeles: el SVG del mapa lleva su
// viewBox en metros y se estira al ancho del contenedor, así que un porcentaje cae siempre sobre el
// mismo metro pase lo que pase con el tamaño de la pantalla. En píxeles habría que medir el DOM.

/** Tramos a los que se aspira. Ocho da entre cinco y nueve marcas en la mayoría de recintos. */
const TARGET_DIVISIONS = 8;

const NICE_MULTIPLES = [1, 2, 5, 10] as const;

export type RulerTick = {
  valueM: number;
  /** 0 = el borde inferior o izquierdo de lo dibujado, 100 = el opuesto. */
  positionPct: number;
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
 * Marcas dentro del tramo dibujado. Arranca en el primer múltiplo del paso que caiga dentro, no en
 * el borde: el borde lleva el metro de aire que el mapa deja alrededor y rotularlo diría que el
 * recinto empieza donde no empieza.
 */
export function rulerTicks(minM: number, lengthM: number): RulerTick[] {
  if (!(lengthM > 0)) return [];

  const step = niceStepM(lengthM);
  const first = Math.ceil(minM / step) * step;
  const ticks: RulerTick[] = [];

  for (let value = first; value <= minM + lengthM + 1e-9; value += step) {
    // El redondeo evita que la suma repetida arrastre 0.30000000000000004 hasta la etiqueta.
    const valueM = Number(value.toFixed(6));
    ticks.push({
      valueM,
      positionPct: ((valueM - minM) / lengthM) * 100,
    });
  }

  return ticks;
}

/** Sin decimales cuando no hacen falta: "4 m" se lee antes que "4.0 m". */
export function formatMetres(valueM: number): string {
  return Number.isInteger(valueM) ? `${valueM}` : valueM.toFixed(1);
}
