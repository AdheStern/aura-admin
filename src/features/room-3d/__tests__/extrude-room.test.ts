// src/features/room-3d/__tests__/extrude-room.test.ts — la extrusión contra las cuatro fixtures del
// editor 2D (mismo patrón que room-fixtures.test.ts): si un cambio en el dominio de room-editor
// rompe la correspondencia muro↔arista, tiene que verse aquí y no como un pilar mal plantado en la
// vista 3D.

import { describe, expect, it } from "vitest";
import {
  extrudeRoom,
  type Point3d,
} from "@/features/room-3d/model/extrude-room";
import {
  buildRoom,
  rectPillar,
  rectVertices,
  windowOpening,
} from "@/features/room-editor/__tests__/fixtures/room-builder";
import lShapedRoom from "@/features/room-editor/fixtures/l-shaped-room.json";
import roomWithPillarsAndOpenings from "@/features/room-editor/fixtures/room-with-pillars-and-openings.json";
import shoeboxSmall from "@/features/room-editor/fixtures/shoebox-small.json";
import shoeboxWithStage from "@/features/room-editor/fixtures/shoebox-with-stage.json";
import { parseRoom } from "@/features/room-editor/schemas/parse-room";

const FIXTURES = {
  "shoebox-small": shoeboxSmall,
  "shoebox-with-stage": shoeboxWithStage,
  "l-shaped-room": lShapedRoom,
  "room-with-pillars-and-openings": roomWithPillarsAndOpenings,
};

describe.each(Object.entries(FIXTURES))("%s", (_name, raw) => {
  it("un muro por arista, un pilar por obstáculo, una abertura por hueco", () => {
    const parsed = parseRoom(raw);
    if (!parsed.ok) throw new Error(parsed.message);

    const extruded = extrudeRoom(parsed.data);
    expect(extruded.walls).toHaveLength(parsed.data.footprint.vertices.length);
    expect(extruded.obstacles).toHaveLength(parsed.data.obstacles.length);
    expect(extruded.openings).toHaveLength(parsed.data.openings.length);
  });

  it("techo y paredes llegan exactamente a la altura del documento", () => {
    const parsed = parseRoom(raw);
    if (!parsed.ok) throw new Error(parsed.message);

    const extruded = extrudeRoom(parsed.data);
    const heightM = parsed.data.height.h;

    expect(
      extruded.ceiling.triangles.flat().every((p) => p[1] === heightM),
    ).toBe(true);
    expect(
      extruded.walls.every(
        (wall) =>
          wall.corners[2][1] === heightM && wall.corners[3][1] === heightM,
      ),
    ).toBe(true);
  });
});

describe("extrudeRoom", () => {
  it("cada muro lleva la selección de SU arista, en orden", () => {
    const vertices = rectVertices(20, 12);
    const document = buildRoom({ kind: "setFootprint", vertices });

    const extruded = extrudeRoom(document);
    expect(extruded.walls.map((w) => w.selection.id)).toEqual([
      "wall_0",
      "wall_1",
      "wall_2",
      "wall_3",
    ]);
  });

  it("el quad de una pared va del piso al techo, en las esquinas de su arista", () => {
    const document = buildRoom(
      { kind: "setFootprint", vertices: rectVertices(20, 12) },
      { kind: "setHeight", heightM: 6 },
    );

    const [wall0] = extrudeRoom(document).walls;
    expect(wall0.corners).toEqual([
      [0, 0, 0],
      [20, 0, 0],
      [20, 6, 0],
      [0, 6, 0],
    ] satisfies Point3d[]);
  });

  it("piso y techo triangulan el footprint en abanico, sin perder área", () => {
    const document = buildRoom({
      kind: "setFootprint",
      vertices: rectVertices(20, 12),
    });

    const { floor, ceiling } = extrudeRoom(document);
    expect(floor.triangles).toHaveLength(2);
    expect(ceiling.triangles).toHaveLength(2);
    expect(triangleAreaSum(floor.triangles)).toBeCloseTo(20 * 12, 6);
    expect(triangleAreaSum(ceiling.triangles)).toBeCloseTo(20 * 12, 6);
  });

  it("un pilar conserva su centro, su tamaño y toda la altura de la sala", () => {
    const document = buildRoom(
      { kind: "setFootprint", vertices: rectVertices(20, 12) },
      { kind: "setHeight", heightM: 6 },
      { kind: "insertObstacle", index: 0, obstacle: rectPillar("p1", [8, 5]) },
    );

    const [obstacle] = extrudeRoom(document).obstacles;
    expect(obstacle).toMatchObject({
      selection: { kind: "obstacle", id: "p1" },
      shape: "rect",
      centerM: [8, 5],
      sizeM: [0.6, 0.6],
      heightM: 6,
    });
  });

  it("una abertura queda pegada a su muro, desplazada solo por el margen anti z-fighting", () => {
    const document = buildRoom(
      { kind: "setFootprint", vertices: rectVertices(20, 12) },
      {
        kind: "insertOpening",
        index: 0,
        opening: windowOpening("w1", "wall_0", [3, 1.2, 2, 1.5]),
      },
    );

    const [opening] = extrudeRoom(document).openings;
    expect(opening.selection).toEqual({ kind: "opening", id: "w1" });
    // wall_0 va de (0,0) a (20,0): el eje x local es el x del documento, y offset hacia z<0 (afuera).
    const [bl, br, tr, tl] = opening.corners;
    expect(bl[0]).toBeCloseTo(3, 6);
    expect(br[0]).toBeCloseTo(5, 6);
    expect(bl[1]).toBeCloseTo(1.2, 6);
    expect(tl[1]).toBeCloseTo(2.7, 6);
    expect(bl[2]).toBeLessThan(0);
    expect(tr[2]).toBeLessThan(0);
  });
});

function triangleAreaSum(
  triangles: readonly (readonly [Point3d, Point3d, Point3d])[],
): number {
  return triangles.reduce((total, [a, b, c]) => {
    const abX = b[0] - a[0];
    const abZ = b[2] - a[2];
    const acX = c[0] - a[0];
    const acZ = c[2] - a[2];
    return total + Math.abs(abX * acZ - abZ * acX) / 2;
  }, 0);
}
