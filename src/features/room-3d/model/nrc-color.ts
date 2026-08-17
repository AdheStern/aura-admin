// src/features/room-3d/model/nrc-color.ts — color de una superficie por su NRC (§5.3: "código de
// color por NRC para feedback visual"). NRC alto = absorbe más energía: la escala tiene que crecer
// con la absorción, no es una elección estética libre.
//
// La escala es de GRISES —claro refleja, oscuro absorbe— y no de rojo a verde. Dos razones:
//
//   · El rojo puro le tocaba a la sala corriente: hormigón, yeso y madera viven entre NRC 0.05 y
//     0.15, así que un recinto perfectamente normal se pintaba entero de rojo y se leía como "algo
//     va mal" cuando lo único que decía es que sus paredes son duras.
//   · El recinto es el FONDO de esta escena, no su asunto. Lo que hay que distinguir de un vistazo
//     son las zonas (verde audiencia, violeta escenario) y las cajas: si los muros gastan color,
//     compiten con ellas y se camuflan unas con otros. En grises, lo único con color es lo que
//     importa mirar.
//
// Oscuro = absorbente no es arbitrario: es la lectura física (una superficie absorbente devuelve
// menos energía) y coincide con el aspecto real del material tratado, que es mate y oscuro.

import type { MaterialSpec } from "@/contracts/material-spec.schema";

const NRC_BANDS = ["250", "500", "1000", "2000"] as const;

/** Mismo criterio que documenta el comentario de `nrc` en material-spec.schema.ts: promedio de las
 *  cuatro bandas centrales, redondeado a 0.05. Se usa como respaldo — el catálogo puede traer el
 *  NRC ya calculado y ese es el que manda. */
export function deriveNrc(
  spec: Pick<MaterialSpec, "nrc" | "absorption">,
): number {
  if (spec.nrc !== undefined) return spec.nrc;

  const sum = NRC_BANDS.reduce(
    (total, band) => total + (spec.absorption[band] ?? 0),
    0,
  );
  return Math.round((sum / NRC_BANDS.length) * 20) / 20;
}

/** #e4e4e7 (zinc-200). Fuera de la rampa por ARRIBA: más claro que cualquier valor de la escala,
 *  para que "sin dato" no se confunda con ningún NRC concreto. */
const UNASSIGNED_HEX = "#e4e4e7";
/** #a1a1aa (zinc-400): la pared dura. */
const LOW_RGB: readonly [number, number, number] = [161, 161, 170];
/** #3f3f46 (zinc-700): tratamiento absorbente. */
const HIGH_RGB: readonly [number, number, number] = [63, 63, 70];

/** `null` = sin material asignado (mismo significado que en MaterialSelect). */
export function nrcColorHex(nrc: number | null): string {
  if (nrc === null) return UNASSIGNED_HEX;

  const t = Math.min(1, Math.max(0, nrc));
  const [r, g, b] = LOW_RGB.map((low, i) =>
    Math.round(low + (HIGH_RGB[i] - low) * t),
  );
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
