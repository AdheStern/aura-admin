// src/features/room-editor/__tests__/rectangle-from-photo.test.ts — la proporción desde la foto.
//
// Se comprueba contra una cámara SINTÉTICA: se proyecta un rectángulo de medidas conocidas con un
// modelo estenopeico de píxel cuadrado y se exige recuperar su proporción. Es la única forma de
// asertar esto sin una foto, y además falla si alguien toca el orden de las esquinas — que es el
// error fácil, porque el artículo empareja lados opuestos y no el recorrido del contorno.

import { describe, expect, it } from "vitest";
import {
  estimateAspectRatio,
  rectangleFootprint,
} from "@/features/room-editor/model/rectangle-from-photo";
import type { Point2d } from "@/features/room-editor/schemas/room-document";

const IMAGE_W = 1280;
const IMAGE_H = 720;
const FOCAL_PX = 900;

type Vec3 = [number, number, number];

function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / length, v[1] / length, v[2] / length];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Estenopeica con píxel cuadrado y punto principal en el centro: el modelo que supone el método. */
function project(pointM: Vec3, eye: Vec3, target: Vec3): Point2d {
  const zc = normalize([
    target[0] - eye[0],
    target[1] - eye[1],
    target[2] - eye[2],
  ]);
  const xc = normalize(cross(zc, [0, 0, 1]));
  const yc = cross(zc, xc);

  const relative: Vec3 = [
    pointM[0] - eye[0],
    pointM[1] - eye[1],
    pointM[2] - eye[2],
  ];
  const depth = dot(relative, zc);

  return [
    (FOCAL_PX * dot(relative, xc)) / depth + IMAGE_W / 2,
    (FOCAL_PX * dot(relative, yc)) / depth + IMAGE_H / 2,
  ];
}

/** Las cuatro esquinas del piso, tocadas en orden alrededor, vistas desde `eye`. */
function photograph(widthM: number, depthM: number, eye: Vec3): Point2d[] {
  const target: Vec3 = [widthM / 2, depthM / 2, 0];
  return (
    [
      [0, 0, 0],
      [widthM, 0, 0],
      [widthM, depthM, 0],
      [0, depthM, 0],
    ] as Vec3[]
  ).map((corner) => project(corner, eye, target));
}

describe("estimateAspectRatio", () => {
  // Desde una esquina los dos pares de lados convergen, la focal se despeja y la solución es exacta.
  it("recupera la proporción de una foto tomada desde una esquina", () => {
    const quad = photograph(8, 5, [-2.5, -6, 2.2]);
    const estimate = estimateAspectRatio(quad, IMAGE_W, IMAGE_H);

    expect(estimate).not.toBeNull();
    expect(estimate?.widthOverDepth).toBeCloseTo(8 / 5, 2);
    expect(estimate?.assumedFocal).toBe(false);
  });

  it("acierta también en una sala alargada", () => {
    const quad = photograph(16, 4, [-3, -9, 3]);
    const estimate = estimateAspectRatio(quad, IMAGE_W, IMAGE_H);

    expect(estimate?.widthOverDepth).toBeCloseTo(4, 1);
    expect(estimate?.assumedFocal).toBe(false);
  });

  // Encarando la sala desde el centro del muro, un par de lados no converge: la focal no se puede
  // despejar y se supone. Sigue sirviendo, pero es más basto y hay que declararlo.
  it("supone la focal cuando la foto es simétrica, y lo dice", () => {
    const estimate = estimateAspectRatio(
      photograph(8, 5, [4, -6, 2.2]),
      IMAGE_W,
      IMAGE_H,
    );

    expect(estimate?.assumedFocal).toBe(true);
    expect(estimate?.widthOverDepth).toBeCloseTo(8 / 5, 0);
  });

  it("acierta con una sala más profunda que ancha", () => {
    const quad = photograph(6, 9, [-3, -7, 2.5]);

    expect(
      estimateAspectRatio(quad, IMAGE_W, IMAGE_H)?.widthOverDepth,
    ).toBeCloseTo(6 / 9, 2);
  });

  it("no confunde el ancho con el fondo al invertir la sala", () => {
    const wide = estimateAspectRatio(
      photograph(9, 3, [-2, -6, 2.5]),
      IMAGE_W,
      IMAGE_H,
    );
    const deep = estimateAspectRatio(
      photograph(3, 9, [-2, -8, 2.5]),
      IMAGE_W,
      IMAGE_H,
    );

    expect(wide?.widthOverDepth).toBeGreaterThan(1);
    expect(deep?.widthOverDepth).toBeLessThan(1);
  });

  // La foto de frente es la más fácil de tomar y no tiene convergencia de la que sacar la focal.
  it("cae a la proporción plana cuando no hay perspectiva", () => {
    const estimate = estimateAspectRatio(
      [
        [100, 100],
        [500, 100],
        [500, 350],
        [100, 350],
      ],
      IMAGE_W,
      IMAGE_H,
    );

    expect(estimate?.widthOverDepth).toBeCloseTo(400 / 250, 3);
  });

  it("rechaza lo que no son cuatro esquinas", () => {
    expect(
      estimateAspectRatio(
        [
          [0, 0],
          [1, 0],
          [1, 1],
        ],
        IMAGE_W,
        IMAGE_H,
      ),
    ).toBeNull();
  });

  it("no devuelve NaN con cuatro toques degenerados", () => {
    const estimate = estimateAspectRatio(
      [
        [10, 10],
        [10, 10],
        [10, 10],
        [10, 10],
      ],
      IMAGE_W,
      IMAGE_H,
    );

    expect(estimate === null || Number.isFinite(estimate.widthOverDepth)).toBe(
      true,
    );
  });
});

describe("rectangleFootprint", () => {
  it("centra la planta en el origen", () => {
    expect(rectangleFootprint(8, 5)).toEqual([
      [-4, -2.5],
      [4, -2.5],
      [4, 2.5],
      [-4, 2.5],
    ]);
  });

  it("sale en sentido antihorario, que es lo que exige el contrato", () => {
    const [a, b, c] = rectangleFootprint(6, 4);
    const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

    expect(cross).toBeGreaterThan(0);
  });
});
