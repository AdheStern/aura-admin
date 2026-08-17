// src/lib/__tests__/performance-budget.test.ts — la prueba de que los techos de la app se cumplen.
//
// Se mide la MEDIANA de varias repeticiones y no una sola pasada: en una máquina compartida —y un
// runner de CI lo es— cualquier medición aislada recoge el ruido de otro proceso y el test se
// vuelve intermitente, que es la peor clase de test de rendimiento.
//
// Los techos están un orden de magnitud por encima de lo medido a propósito. No vigilan
// milisegundos: vigilan que nadie meta un bucle cuadrático o una copia por punto sin enterarse.

import { describe, expect, it } from "vitest";
import { buildSplRaster } from "@/features/room-3d/model/spl-texture";
import { compileCanon } from "@/features/simulation/__tests__/fixtures/canon-scene";
import {
  COMPILE_REQUEST_BUDGET_MS,
  REQUEST_SIZE_BUDGET_BYTES,
  SPL_RASTER_BUDGET_MS,
  SPL_RASTER_BUDGET_POINTS,
} from "@/lib/performance-budget";

const REPEATS = 21;

function medianMs(operation: () => unknown): number {
  operation(); // Calentamiento: la primera pasada paga la compilación JIT y no representa nada.

  const samples = Array.from({ length: REPEATS }, () => {
    const started = performance.now();
    operation();
    return performance.now() - started;
  }).sort((a, b) => a - b);

  return samples[Math.floor(samples.length / 2)];
}

/** Grilla regular de ~400 puntos, el presupuesto de la Sección 6.2 que el motor puede devolver. */
function squareGrid(points: number) {
  const side = Math.round(Math.sqrt(points));
  const coordinates: number[][] = [];
  const values: number[] = [];

  for (let row = 0; row < side; row++) {
    for (let column = 0; column < side; column++) {
      coordinates.push([column, row, 1.2]);
      // Recorre el rango entero de la escala para que ninguna rama del color quede sin ejercitar.
      values.push(70 + ((row * side + column) % 41));
    }
  }

  return { coordinates, values };
}

describe("presupuesto de rendimiento", () => {
  it("compilar el payload de CANON-01 cabe en su techo", () => {
    expect(medianMs(compileCanon)).toBeLessThan(COMPILE_REQUEST_BUDGET_MS);
  });

  it("el payload de CANON-01 cabe en su techo de tamaño", () => {
    // Importa el tamaño porque se firma, viaja y se guarda entero en Simulation.request: un payload
    // que se desmadre no rompe nada de golpe, engorda la BD y la firma en silencio.
    const bytes = Buffer.byteLength(JSON.stringify(compileCanon()), "utf8");
    expect(bytes).toBeLessThan(REQUEST_SIZE_BUDGET_BYTES);
  });

  it("rasterizar la grilla completa cabe en su techo", () => {
    const { coordinates, values } = squareGrid(SPL_RASTER_BUDGET_POINTS);
    expect(coordinates).toHaveLength(SPL_RASTER_BUDGET_POINTS);

    expect(medianMs(() => buildSplRaster(coordinates, values, 1))).toBeLessThan(
      SPL_RASTER_BUDGET_MS,
    );
  });
});
