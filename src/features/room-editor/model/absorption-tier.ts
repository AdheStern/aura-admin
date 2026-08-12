// src/features/room-editor/model/absorption-tier.ts — en qué tramo cae un coeficiente de absorción.
//
// Tres tramos y no una rampa continua: mirando la ficha de un material la pregunta es "¿esta banda
// la absorbe o la devuelve?", y el valor exacto ya está escrito dentro del propio recuadro. El color
// solo tiene que responder esa pregunta de un vistazo, y para eso tres escalones se leen mejor que
// un degradado donde 0.31 y 0.36 son tonos distintos que no significan nada distinto.
//
// Los cortes son los de uso corriente en acústica de salas: por debajo de 0.20 la superficie es
// reflectante a efectos prácticos, por encima de 0.50 es tratamiento absorbente, y en medio no es
// ni una cosa ni la otra. Ninguno de los tres es "bueno" o "malo" — una sala necesita los tres, y
// por eso la leyenda los nombra en vez de dejar que el rojo se lea como un error.

export type AbsorptionTier = "reflective" | "mixed" | "absorbent";

export const REFLECTIVE_BELOW = 0.2;
export const ABSORBENT_FROM = 0.5;

export function absorptionTier(alpha: number): AbsorptionTier {
  if (alpha < REFLECTIVE_BELOW) return "reflective";
  if (alpha < ABSORBENT_FROM) return "mixed";
  return "absorbent";
}
