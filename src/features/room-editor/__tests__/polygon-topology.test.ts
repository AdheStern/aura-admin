// src/features/room-editor/__tests__/polygon-topology.test.ts — dentro, fuera y encima.
// Los tres casos que rompen las implementaciones ingenuas: el vértice que el rayo atraviesa a su
// misma altura, la zona que cubre el recinto entero (todo su borde compartido) y el polígono que
// se apoya en el contorno pero tapa una muesca que está fuera.

import { describe, expect, it } from "vitest";
import { rectVertices } from "@/features/room-editor/__tests__/fixtures/room-builder";
import {
  isPolygonInsidePolygon,
  pointInPolygon,
  polygonsOverlap,
} from "@/features/room-editor/model/polygon-topology";
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

describe("punto en polígono", () => {
  it("distingue interior, borde y exterior", () => {
    expect(pointInPolygon([5, 5], SQUARE)).toBe("inside");
    expect(pointInPolygon([15, 5], SQUARE)).toBe("outside");
    expect(pointInPolygon([5, 0], SQUARE)).toBe("boundary");
    expect(pointInPolygon([0, 0], SQUARE)).toBe("boundary");
  });

  it("no cuenta dos veces el vértice que el rayo atraviesa a su altura", () => {
    expect(pointInPolygon([3, 2], NOTCHED)).toBe("inside");
    expect(pointInPolygon([5, 8], NOTCHED)).toBe("outside");
  });
});

describe("contención", () => {
  it("acepta una zona que cubre el recinto entero", () => {
    expect(isPolygonInsidePolygon(SQUARE, SQUARE)).toBe(true);
  });

  it("acepta una zona interior", () => {
    expect(isPolygonInsidePolygon(rectVertices(4, 4), SQUARE)).toBe(true);
  });

  it("rechaza una zona que asoma", () => {
    expect(isPolygonInsidePolygon(rectVertices(12, 4), SQUARE)).toBe(false);
  });

  // Los tres vértices del triángulo son vértices del recinto y ninguna arista corta el contorno:
  // sin probar los puntos medios, la muesca —que está FUERA— pasaría por dentro.
  it("rechaza el triángulo que tapa la muesca del polígono cóncavo", () => {
    const overTheNotch: Polygon2d = [
      [10, 10],
      [0, 10],
      [5, 2],
    ];
    expect(isPolygonInsidePolygon(overTheNotch, NOTCHED)).toBe(false);
  });
});

describe("solape", () => {
  it("no considera solape compartir un borde", () => {
    const left: Polygon2d = [
      [0, 0],
      [5, 0],
      [5, 10],
      [0, 10],
    ];
    const right: Polygon2d = [
      [5, 0],
      [10, 0],
      [10, 10],
      [5, 10],
    ];
    expect(polygonsOverlap(left, right)).toBe(false);
  });

  it("detecta el solape con área y ignora los polígonos disjuntos", () => {
    const overlapping: Polygon2d = [
      [4, 4],
      [14, 4],
      [14, 8],
      [4, 8],
    ];
    const faraway: Polygon2d = [
      [20, 0],
      [22, 0],
      [22, 2],
      [20, 2],
    ];
    expect(polygonsOverlap(SQUARE, overlapping)).toBe(true);
    expect(polygonsOverlap(SQUARE, faraway)).toBe(false);
  });
});
