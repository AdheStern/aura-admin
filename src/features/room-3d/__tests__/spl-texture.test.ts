// src/features/room-3d/__tests__/spl-texture.test.ts — la grilla convertida en mapa de bits.
//
// Lo que se comprueba es lo que se ve mal en pantalla y no salta en ningún otro sitio: que la fila
// 0 sea la de menor y, que los huecos queden transparentes y que el plano cubra media celda de más
// por cada borde.

import { describe, expect, it } from "vitest";
import { buildSplRaster } from "@/features/room-3d/model/spl-texture";
import { splColorRgb } from "@/features/simulation/model/spl-scale";

type Point = readonly [number, number, number];

/** Rejilla de 3 × 2 con paso 1 m, empezando en (10, 20). */
const GRID: Point[] = [
  [10, 20, 1.2],
  [11, 20, 1.2],
  [12, 20, 1.2],
  [10, 21, 1.2],
  [11, 21, 1.2],
  [12, 21, 1.2],
];

function pixel(
  raster: NonNullable<ReturnType<typeof buildSplRaster>>,
  column: number,
  row: number,
) {
  const offset = (row * raster.width + column) * 4;
  return [...raster.data.slice(offset, offset + 4)];
}

describe("buildSplRaster", () => {
  it("deduce el ancho y el alto del paso de grilla", () => {
    const raster = buildSplRaster(GRID, [70, 70, 70, 70, 70, 70], 1);

    expect(raster?.width).toBe(3);
    expect(raster?.height).toBe(2);
  });

  it("la fila 0 es la de MENOR y del documento", () => {
    // 70 dB en la fila de abajo (y = 20), 110 en la de arriba (y = 21).
    const raster = buildSplRaster(GRID, [70, 70, 70, 110, 110, 110], 1);
    if (!raster) throw new Error("sin raster");

    expect(pixel(raster, 0, 0)).toEqual([...splColorRgb(70), 255]);
    expect(pixel(raster, 0, 1)).toEqual([...splColorRgb(110), 255]);
  });

  it("una celda sin punto queda transparente en vez de pintarse", () => {
    const withHole = GRID.filter((_, index) => index !== 1);
    const raster = buildSplRaster(withHole, [70, 70, 70, 70, 70], 1);
    if (!raster) throw new Error("sin raster");

    expect(pixel(raster, 1, 0)).toEqual([0, 0, 0, 0]);
    expect(pixel(raster, 0, 0)[3]).toBe(255);
  });

  it("el plano cubre media celda de más por cada borde", () => {
    const raster = buildSplRaster(GRID, [70, 70, 70, 70, 70, 70], 1);

    // 3 columnas de 1 m y 2 filas de 1 m.
    expect(raster?.sizeM).toEqual([3, 2]);
    // Centro entre el primer y el último punto: (10+12)/2, (20+21)/2.
    expect(raster?.centerM).toEqual([11, 20.5]);
  });

  it("tolera el error de coma flotante del linspace del motor", () => {
    const drifted: Point[] = [
      [0, 0, 1.2],
      [0.9999999999, 0, 1.2],
      [2.0000000001, 0, 1.2],
    ];
    const raster = buildSplRaster(drifted, [70, 90, 110], 1);
    if (!raster) throw new Error("sin raster");

    expect(raster.width).toBe(3);
    expect(pixel(raster, 1, 0)).toEqual([...splColorRgb(90), 255]);
  });

  it("una grilla vacía no produce textura", () => {
    expect(buildSplRaster([], [], 1)).toBeNull();
  });
});
