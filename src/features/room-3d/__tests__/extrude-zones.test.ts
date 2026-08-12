// src/features/room-3d/__tests__/extrude-zones.test.ts — zonas del documento a geometría 3D.

import { describe, expect, it } from "vitest";
import { extrudeZones } from "@/features/room-3d/model/extrude-zones";
import {
  EMPTY_ROOM,
  type RoomDocument,
} from "@/features/room-editor/schemas/room-document";

const SQUARE: RoomDocument["zones"]["audience"][number]["polygon"] = [
  [0, 0],
  [4, 0],
  [4, 4],
  [0, 4],
];

function documentWith(zones: RoomDocument["zones"]): RoomDocument {
  return { ...EMPTY_ROOM, zones };
}

describe("extrudeZones", () => {
  it("una sala sin zonas no produce geometría", () => {
    const zones = extrudeZones(EMPTY_ROOM);

    expect(zones.audience).toEqual([]);
    expect(zones.stage).toBeNull();
  });

  it("la audiencia es una tapa plana: sin laterales", () => {
    const [zone] = extrudeZones(
      documentWith({
        stage: null,
        audience: [{ id: "a1", polygon: SQUARE, earHeight: 1.2, seated: true }],
      }),
    ).audience;

    // Cuadrado en abanico = 2 triángulos, y ninguna cara lateral.
    expect(zone.triangles).toHaveLength(2);
    expect(zone.triangles.every(([, , [, y]]) => y < 0.05)).toBe(true);
  });

  it("el escenario se levanta a su elevación, con laterales", () => {
    const zone = extrudeZones(
      documentWith({
        stage: { id: "s1", polygon: SQUARE, elevation: 0.8 },
        audience: [],
      }),
    ).stage;

    // 2 de la tapa + 2 por cada una de las 4 aristas del cuadrado.
    expect(zone?.triangles).toHaveLength(10);
    expect(zone?.outline.every(([, y]) => y > 0.8)).toBe(true);
  });

  it("un escenario a ras del suelo no genera laterales", () => {
    const zone = extrudeZones(
      documentWith({
        stage: { id: "s1", polygon: SQUARE, elevation: 0 },
        audience: [],
      }),
    ).stage;

    expect(zone?.triangles).toHaveLength(2);
  });

  it("la planta [x, y] del documento va a [x, altura, y] de three.js", () => {
    const zone = extrudeZones(
      documentWith({
        stage: { id: "s1", polygon: SQUARE, elevation: 2 },
        audience: [],
      }),
    ).stage;

    // Primer vértice de la tapa: [0, 0] del plano, a 2 m de altura.
    expect(zone?.triangles[0][0]).toEqual([0, 2, 0]);
  });
});
