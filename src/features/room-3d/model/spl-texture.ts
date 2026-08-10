// src/features/room-3d/model/spl-texture.ts — la grilla del motor, hecha mapa de bits.
//
// Puro y sin three.js: el componente solo envuelve esto en una DataTexture, así que las cuentas
// delicadas —qué celda es cada punto, dónde cae el plano— se pueden asertar sin WebGL.
//
// La grilla es regular con paso `resolutionM`, así que cada punto es una celda de ese lado, igual
// que en el mapa 2D. Las celdas sin punto quedan TRANSPARENTES: la zona de audiencia rara vez es un
// rectángulo, y rellenarlas pintaría nivel donde el motor no calculó ninguno.
//
// La fila 0 es la de MENOR y del documento. El componente rota el plano para que la v de la textura
// crezca con la y del recinto; escribir las filas al revés dejaría el mapa reflejado respecto al
// editor 2D, que es un fallo silencioso — se ve plausible y está mal.

import { splColorRgb } from "@/features/simulation/model/spl-scale";

export type SplRaster = {
  /** RGBA, fila 0 = menor y. Ancho × alto × 4. */
  data: Uint8Array;
  width: number;
  height: number;
  /** Centro del plano en el marco del contrato (x, y), en metros. */
  centerM: [number, number];
  /** Lado del plano en metros: incluye media celda de margen por cada borde. */
  sizeM: [number, number];
};

const CHANNELS = 4;

export function buildSplRaster(
  points: readonly (readonly number[])[],
  values: readonly number[],
  resolutionM: number,
): SplRaster | null {
  if (points.length === 0 || resolutionM <= 0) return null;

  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);

  const width = columnOf(Math.max(...xs), minX, resolutionM) + 1;
  const height = columnOf(Math.max(...ys), minY, resolutionM) + 1;

  const data = new Uint8Array(width * height * CHANNELS);

  points.forEach((point, index) => {
    const value = values[index];
    if (typeof value !== "number") return;

    const column = columnOf(point[0], minX, resolutionM);
    const row = columnOf(point[1], minY, resolutionM);
    const offset = (row * width + column) * CHANNELS;
    const [r, g, b] = splColorRgb(value);

    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = 255;
  });

  return {
    data,
    width,
    height,
    centerM: [
      minX + ((width - 1) * resolutionM) / 2,
      minY + ((height - 1) * resolutionM) / 2,
    ],
    sizeM: [width * resolutionM, height * resolutionM],
  };
}

/** Redondear y no truncar: los puntos vienen de un linspace y traen error de coma flotante, así
 *  que un 3.9999999 tiene que caer en la celda 4 y no en la 3. */
function columnOf(coordinate: number, minimum: number, resolutionM: number) {
  return Math.round((coordinate - minimum) / resolutionM);
}
