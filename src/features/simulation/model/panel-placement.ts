// src/features/simulation/model/panel-placement.ts — el panel, del muro al plano.
//
// Traduce "muro 2, a 3 m de su esquina, 2 m de ancho" a los dos puntos que hay que dibujar. Toda la
// geometría vive aquí y no en el componente para poder asertarla: que un panel caiga en el muro
// equivocado, o volcado hacia fuera de la sala, no es algo que se detecte mirando un SVG pequeño.
//
// Se separa del muro hacia DENTRO en vez de pintarse encima: encima, el trazo del panel y el del
// contorno se confunden en uno solo y no se ve dónde acaba la pared y empieza el tratamiento. Con la
// normal interior queda pegado a su muro —que es como se cuelga— y a la vez legible. Se usa
// `inwardNormalM`, que resuelve el lado contra el centroide en vez de fiarse del sentido de giro:
// el footprint debería ser antihorario, pero eso es una invariante que no conviene asumir aquí.
//
// EL MODELO SE SALE DEL MURO con más frecuencia de la que parece: pide un panel de 4 m en un muro de
// 3, o lo arranca más allá de la esquina. `fitPanel` recorta en vez de descartar —un panel que se
// pasa 20 cm sigue siendo un buen consejo— pero devuelve null si no queda nada que valga la pena.

import {
  inwardNormalM,
  polygonEdges,
} from "@/features/room-editor/model/polygon-2d";
import type {
  Point2d,
  Polygon2d,
} from "@/features/room-editor/schemas/room-document";
import {
  type AcousticPanel,
  PANEL_MIN_LENGTH_M,
} from "@/features/simulation/schemas/panel-advice";

/** Separación del muro al dibujar, en metros. Suficiente para distinguir los dos trazos. */
const OFFSET_M = 0.25;

export type PlacedPanel = {
  panel: AcousticPanel;
  /** Los dos extremos del trazo, ya separados del muro hacia el interior. */
  from: Point2d;
  to: Point2d;
  /** Punto medio, para colgar la etiqueta. */
  midpoint: Point2d;
  /** Lo que mide el muro donde va, para poder decir cuánto de él se cubre. */
  wallLengthM: number;
  /** Si hubo que recortarlo para que cupiera. Se dice en pantalla: es criterio corregido. */
  clamped: boolean;
};

/**
 * Ajusta el panel a su muro y devuelve dónde dibujarlo. null si el muro no existe o si, después de
 * recortar, no queda un panel que merezca pintarse.
 */
export function placePanel(
  footprint: Polygon2d,
  panel: AcousticPanel,
): PlacedPanel | null {
  const edge = polygonEdges(footprint)[panel.wallIndex];
  if (!edge) return null;

  const dx = edge.to[0] - edge.from[0];
  const dy = edge.to[1] - edge.from[1];
  const wallLengthM = Math.hypot(dx, dy);
  if (wallLengthM <= 0) return null;

  const fitted = fitPanel(panel, wallLengthM);
  if (!fitted) return null;

  const [nx, ny] = inwardNormalM(edge, footprint);
  const along = (distanceM: number): Point2d => [
    edge.from[0] + (dx / wallLengthM) * distanceM + nx * OFFSET_M,
    edge.from[1] + (dy / wallLengthM) * distanceM + ny * OFFSET_M,
  ];

  const from = along(fitted.startM);
  const to = along(fitted.startM + fitted.lengthM);

  return {
    panel,
    from,
    to,
    midpoint: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2],
    wallLengthM,
    clamped: fitted.clamped,
  };
}

export type FittedPanel = {
  startM: number;
  lengthM: number;
  clamped: boolean;
};

/** Recorta el panel a lo que cabe en el muro. null si no queda medio metro. */
export function fitPanel(
  panel: AcousticPanel,
  wallLengthM: number,
): FittedPanel | null {
  if (wallLengthM < PANEL_MIN_LENGTH_M) return null;

  const startM = Math.min(Math.max(panel.startM, 0), wallLengthM);
  const lengthM = Math.min(panel.lengthM, wallLengthM - startM);
  if (lengthM < PANEL_MIN_LENGTH_M) {
    // Cabe, pero no donde lo puso: se corre hacia atrás antes de rendirse, porque un panel que
    // arranca pasada la esquina suele ser un error de la posición y no del tamaño.
    const shifted = Math.max(wallLengthM - panel.lengthM, 0);
    const usable = Math.min(panel.lengthM, wallLengthM);
    return usable >= PANEL_MIN_LENGTH_M
      ? { startM: shifted, lengthM: usable, clamped: true }
      : null;
  }

  return {
    startM,
    lengthM,
    clamped: startM !== panel.startM || lengthM !== panel.lengthM,
  };
}

/** Superficie tratada, para poder decir en pantalla cuántos m² se están proponiendo. */
export function panelAreaM2(placed: PlacedPanel): number {
  const lengthM = Math.hypot(
    placed.to[0] - placed.from[0],
    placed.to[1] - placed.from[1],
  );
  return Number((lengthM * placed.panel.heightM).toFixed(1));
}
