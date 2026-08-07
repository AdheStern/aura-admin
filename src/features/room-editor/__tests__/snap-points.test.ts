// src/features/room-editor/__tests__/snap-points.test.ts — nearestExistingPointM contra un
// documento real (construido por comandos, como room-builder.ts exige), no un objeto a mano: así
// queda claro que lee de las mismas listas que el editor ya persiste, sin un formato paralelo.

import { describe, expect, it } from "vitest";
import {
  audienceZone,
  buildRoom,
  rectPillar,
  rectVertices,
} from "@/features/room-editor/__tests__/fixtures/room-builder";
import { nearestExistingPointM } from "@/features/room-editor/model/snap-points";

const ROOM = buildRoom(
  { kind: "setFootprint", vertices: rectVertices(10, 10) },
  {
    kind: "insertObstacle",
    index: 0,
    obstacle: rectPillar("pillar_1", [5, 5]),
  },
  {
    kind: "insertAudienceZone",
    index: 0,
    zone: audienceZone("zone_1", rectVertices(8, 8)),
  },
);

describe("nearestExistingPointM", () => {
  it("engancha un clic cerca de una esquina del contorno", () => {
    expect(nearestExistingPointM([0.05, 0.05], ROOM)).toEqual([0, 0]);
  });

  it("engancha un clic cerca del centro de un pilar", () => {
    expect(nearestExistingPointM([5.1, 5.05], ROOM)).toEqual([5, 5]);
  });

  it("engancha un clic cerca de un vértice de una zona de audiencia", () => {
    expect(nearestExistingPointM([8.05, 7.95], ROOM)).toEqual([8, 8]);
  });

  it("no engancha nada fuera del radio de snap", () => {
    expect(nearestExistingPointM([5, 0.5], ROOM)).toBeNull();
  });

  it("prefiere el punto existente más cercano cuando hay dos dentro del radio", () => {
    const roomWithNearbyPillar = buildRoom(
      { kind: "setFootprint", vertices: rectVertices(10, 10) },
      {
        kind: "insertObstacle",
        index: 0,
        obstacle: rectPillar("pillar_near_corner", [0.2, 0.05]),
      },
    );
    // (0,0) está a ~0.112 m; el pilar en (0.2, 0.05) está a ~0.1 m — más cerca, y gana.
    expect(nearestExistingPointM([0.1, 0.05], roomWithNearbyPillar)).toEqual([
      0.2, 0.05,
    ]);
  });
});
