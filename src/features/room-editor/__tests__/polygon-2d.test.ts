// src/features/room-editor/__tests__/polygon-2d.test.ts — forma, área y orientación.
// Cada caso está aquí porque una implementación razonable pero descuidada lo falla: la pajarita,
// los vértices colineales en mitad de un lado y la púa que vuelve sobre sí misma.

import { describe, expect, it } from "vitest";
import { rectVertices } from "@/features/room-editor/__tests__/fixtures/room-builder";
import {
  degenerateEdgeIndexes,
  inwardNormalM,
  isCcw,
  isSimplePolygon,
  polygonAreaM2,
  polygonCentroidM,
  signedAreaM2,
} from "@/features/room-editor/model/polygon-2d";
import type { Polygon2d } from "@/features/room-editor/schemas/room-document";

const SQUARE: Polygon2d = rectVertices(10, 10);

/** Cuadrado con una V mordida en el techo: el vértice (5,2) hunde el borde superior. */
const NOTCHED: Polygon2d = [
  [0, 0],
  [10, 0],
  [10, 10],
  [5, 2],
  [0, 10],
];

describe("orientación y área", () => {
  it("mide el área con signo positivo en sentido antihorario", () => {
    expect(signedAreaM2(SQUARE)).toBe(100);
    expect(isCcw(SQUARE)).toBe(true);
  });

  it("invierte el signo con los vértices en sentido horario", () => {
    const clockwise = [...SQUARE].reverse();
    expect(signedAreaM2(clockwise)).toBe(-100);
    expect(isCcw(clockwise)).toBe(false);
    expect(polygonAreaM2(clockwise)).toBe(100);
  });
});

describe("polígono simple", () => {
  it("acepta el rectángulo y el polígono cóncavo", () => {
    expect(isSimplePolygon(SQUARE)).toBe(true);
    expect(isSimplePolygon(NOTCHED)).toBe(true);
  });

  it("rechaza la pajarita: dos aristas no adyacentes se cruzan", () => {
    expect(
      isSimplePolygon([
        [0, 0],
        [10, 10],
        [10, 0],
        [0, 10],
      ]),
    ).toBe(false);
  });

  it("acepta un vértice colineal en mitad de un lado", () => {
    expect(
      isSimplePolygon([
        [0, 0],
        [5, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ]),
    ).toBe(true);
  });

  it("rechaza la púa: la polilínea vuelve sobre sí misma", () => {
    expect(
      isSimplePolygon([
        [0, 0],
        [10, 0],
        [5, 0],
        [5, 5],
      ]),
    ).toBe(false);
  });

  it("rechaza menos de tres vértices", () => {
    expect(
      isSimplePolygon([
        [0, 0],
        [10, 0],
      ]),
    ).toBe(false);
  });

  it("señala las aristas de longitud despreciable por su índice", () => {
    const doubleClick: Polygon2d = [
      [0, 0],
      [10, 0],
      [10, 0.01],
      [0, 10],
    ];
    expect(degenerateEdgeIndexes(doubleClick, 0.05)).toEqual([1]);
  });
});

describe("centroide y normal interior", () => {
  it("promedia los vértices", () => {
    expect(polygonCentroidM(SQUARE)).toEqual([5, 5]);
  });

  it("apunta hacia el centroide en cada lado del cuadrado", () => {
    const bottom = { from: SQUARE[0], to: SQUARE[1] }; // (0,0) -> (10,0)
    const top = { from: SQUARE[2], to: SQUARE[3] }; // (10,10) -> (0,10)
    expect(inwardNormalM(bottom, SQUARE)).toEqual([0, 1]);
    expect(inwardNormalM(top, SQUARE)).toEqual([0, -1]);
  });

  it("no depende del sentido de giro: la misma arista física, invertida, sigue señalando adentro", () => {
    const forward = { from: SQUARE[0], to: SQUARE[1] }; // (0,0) -> (10,0)
    const reversed = { from: SQUARE[1], to: SQUARE[0] }; // (10,0) -> (0,0)
    expect(inwardNormalM(forward, SQUARE)).toEqual(
      inwardNormalM(reversed, SQUARE),
    );
  });
});
