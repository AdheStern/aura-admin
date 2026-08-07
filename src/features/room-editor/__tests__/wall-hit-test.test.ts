// src/features/room-editor/__tests__/wall-hit-test.test.ts — proyección sobre segmento y el muro
// más cercano a un clic. Es la trampa que usa la herramienta de aberturas: `alongM` tiene que ser
// la distancia real a lo largo del muro, no una fracción [0,1], porque eso es lo que el contrato
// espera como `x` local de la abertura.

import { describe, expect, it } from "vitest";
import { canonRoom } from "@/features/room-editor/__tests__/fixtures/room-builder";
import { projectPointOnSegmentM } from "@/features/room-editor/model/geometry-2d";
import { nearestWallHit } from "@/features/room-editor/model/wall-hit-test";
import { EMPTY_ROOM } from "@/features/room-editor/schemas/room-document";

describe("projectPointOnSegmentM", () => {
  it("proyecta perpendicular a un punto interior del segmento", () => {
    const projection = projectPointOnSegmentM([5, 3], [0, 0], [10, 0]);

    expect(projection.pointM).toEqual([5, 0]);
    expect(projection.distanceM).toBe(3);
    expect(projection.alongM).toBe(5);
  });

  it("recorta al extremo más cercano cuando la proyección cae fuera del tramo", () => {
    const projection = projectPointOnSegmentM([-4, 3], [0, 0], [10, 0]);

    expect(projection.pointM).toEqual([0, 0]);
    expect(projection.alongM).toBe(0);
  });

  it("no depende del orden de a y b para la distancia", () => {
    const forward = projectPointOnSegmentM([5, 3], [0, 0], [10, 0]);
    const backward = projectPointOnSegmentM([5, 3], [10, 0], [0, 0]);

    expect(backward.distanceM).toBe(forward.distanceM);
  });
});

describe("nearestWallHit", () => {
  it("identifica el muro y la x local del punto más cercano", () => {
    const hit = nearestWallHit(canonRoom(), [5, 0.1], 1);

    // wall_0 es la arista [0,0]→[20,0] (Sección de la convención muro↔arista).
    expect(hit).toEqual({ surfaceId: "wall_0", localXM: 5, lengthM: 20 });
  });

  it("devuelve null fuera del radio máximo", () => {
    expect(nearestWallHit(canonRoom(), [5, 5], 1)).toBeNull();
  });

  it("devuelve null sobre una planta sin dibujar", () => {
    expect(nearestWallHit(EMPTY_ROOM, [5, 5], 1000)).toBeNull();
  });
});
