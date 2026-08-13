// src/features/simulation/model/mix-levels.ts — dónde cae el fader y cómo se rotula el panorama.
//
// La posición es LINEAL en decibelios sobre el rango del contrato. Un fader de mesa real no lo es
// —expande la zona alrededor de la unidad y comprime el fondo—, pero esa curva es cosmética del
// fabricante: fingirla aquí haría que la cápsula no cayera donde dice el número escrito justo
// encima, y ese número es lo único que el operador va a teclear.
//
// El 0 dB no está a media altura: el rango es asimétrico (−24…+12), así que la unidad queda a dos
// tercios. Por eso se calcula en vez de dibujarse a ojo en el componente.

import { MIX_LEVEL_DB_RANGE } from "@/features/simulation/schemas/mix-advice";

/** Altura del fader en % desde abajo. Se acota al rango: un valor raro no debe salirse del raíl. */
export function faderPositionPct(gainDb: number): number {
  const { min, max } = MIX_LEVEL_DB_RANGE;
  const clamped = Math.min(Math.max(gainDb, min), max);

  return ((clamped - min) / (max - min)) * 100;
}

/** Dónde pintar la línea de unidad, que es la referencia contra la que se lee todo lo demás. */
export function unityPositionPct(): number {
  return faderPositionPct(0);
}

/**
 * El panorama como se rotula en una mesa: `C` en el centro, `L45` / `R30` a los lados. En número
 * crudo (`-45`) habría que traducir el signo mentalmente cada vez.
 */
export function formatPan(panPercent: number): string {
  const rounded = Math.round(panPercent);
  if (rounded === 0) return "C";

  return `${rounded < 0 ? "L" : "R"}${Math.abs(rounded)}`;
}
