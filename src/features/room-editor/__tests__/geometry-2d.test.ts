// src/features/room-editor/__tests__/geometry-2d.test.ts — snapOrthoM es la mitad de la garantía
// de "muro recto" (la otra mitad es el snap a la rejilla, que ya cubre room-fixtures.test.ts contra
// datos reales): sin esto, un segmento casi-horizontal puede llegar aquí y salir igual de torcido.

import { describe, expect, it } from "vitest";
import { snapOrthoM } from "@/features/room-editor/model/geometry-2d";
import type { Point2d } from "@/features/room-editor/schemas/room-document";

const ORIGIN: Point2d = [0, 0];

describe("snapOrthoM", () => {
  it("fuerza la vertical a la del origen cuando el segmento es casi horizontal", () => {
    expect(snapOrthoM(ORIGIN, [10, 1])).toEqual([10, 0]);
  });

  it("fuerza la horizontal a la del origen cuando el segmento es casi vertical", () => {
    expect(snapOrthoM(ORIGIN, [1, 10])).toEqual([0, 10]);
  });

  it("no toca un segmento ya perfectamente horizontal o vertical", () => {
    expect(snapOrthoM(ORIGIN, [10, 0])).toEqual([10, 0]);
    expect(snapOrthoM(ORIGIN, [0, 10])).toEqual([0, 10]);
  });

  it("deja pasar una diagonal deliberada, fuera de la tolerancia", () => {
    expect(snapOrthoM(ORIGIN, [5, 5])).toEqual([5, 5]);
    expect(snapOrthoM(ORIGIN, [10, 2])).toEqual([10, 2]);
  });

  it("no falla con un punto degenerado (origen y destino iguales)", () => {
    expect(snapOrthoM(ORIGIN, [0, 0])).toEqual([0, 0]);
  });

  it("mide el ángulo relativo al origen, no en coordenadas absolutas", () => {
    const from: Point2d = [4, 4];
    expect(snapOrthoM(from, [14, 4.5])).toEqual([14, 4]);
  });
});
