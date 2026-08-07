// src/features/room-editor/__tests__/to-room-geometry.test.ts — la salida del editor contra el
// contrato de verdad. No basta con que "parezca" un RoomGeometry: se parsea con el mismo zod que
// genera el .schema.json que consume aura-engine, así que si el editor produce algo que el motor
// rechazaría, se ve aquí y no en producción.

import { describe, expect, it } from "vitest";
import canonRequest from "@/contracts/fixtures/canon-01.request.json";
import { roomGeometrySchema } from "@/contracts/room-geometry.schema";
import {
  audienceZone,
  buildRoom,
  canonRoom,
  FIXTURE_MATERIAL_ID,
  rectPillar,
  rectVertices,
  wallIds,
  windowOpening,
} from "@/features/room-editor/__tests__/fixtures/room-builder";
import { toRoomGeometry } from "@/features/room-editor/model/to-room-geometry";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";

const DEFAULT_MATERIAL_ID = "mat_default";

const compile = (document: RoomDocument) =>
  toRoomGeometry(document, { defaultMaterialId: DEFAULT_MATERIAL_ID });

describe("compilación al contrato", () => {
  it("la sala de CANON-01 satisface RoomGeometry v1", () => {
    const geometry = compile(canonRoom());

    expect(roomGeometrySchema.safeParse(geometry).success).toBe(true);
    expect(geometry.footprint.vertices).toEqual(
      canonRequest.room.footprint.vertices,
    );
    expect(geometry.height).toEqual(canonRequest.room.height);
    expect(geometry.zones.audience[0].polygon).toEqual(
      canonRequest.room.zones.audience[0].polygon,
    );
  });

  it("rellena con el material por defecto las superficies sin asignar", () => {
    const geometry = compile(canonRoom());

    expect(
      geometry.surfaces.every(
        (surface) => surface.materialId === DEFAULT_MATERIAL_ID,
      ),
    ).toBe(true);
  });

  it("no emite la zona de escenario cuando no hay", () => {
    expect(compile(canonRoom()).zones.stage).toBeUndefined();
  });

  it("arrastra pilares y escenario cuando existen", () => {
    const vertices = rectVertices(20, 12);
    const document = buildRoom(
      { kind: "setFootprint", vertices },
      {
        kind: "insertAudienceZone",
        index: 0,
        zone: audienceZone("zone_1", rectVertices(16, 10)),
      },
      {
        kind: "insertObstacle",
        index: 0,
        obstacle: rectPillar("p1", [8, 5]),
      },
      {
        kind: "setStage",
        stage: { id: "stage_1", polygon: rectVertices(4, 6), elevation: 0.8 },
      },
    );

    const geometry = compile(document);
    expect(roomGeometrySchema.safeParse(geometry).success).toBe(true);
    expect(geometry.zones.stage?.elevation).toBe(0.8);
    // El pilar trae material propio: el defecto solo rellena lo que está sin asignar.
    expect(geometry.obstacles[0]).toMatchObject({
      shape: "rect",
      at: [8, 5],
      materialId: FIXTURE_MATERIAL_ID,
    });
  });
});

describe("renumeración de muros", () => {
  // Dentro del documento el id es estable y puede quedar desordenado (wall_4 en medio); en el
  // contrato manda el ORDEN, así que salen renumerados y la abertura tiene que seguir a su muro.
  it("emite wall_0..wall_n-1 en orden de arista y remapea las aberturas", () => {
    const document = buildRoom(
      { kind: "setFootprint", vertices: rectVertices(20, 12) },
      {
        kind: "insertAudienceZone",
        index: 0,
        zone: audienceZone("zone_1", rectVertices(16, 10)),
      },
      {
        kind: "insertOpening",
        index: 0,
        opening: windowOpening("op_1", "wall_2"),
      },
      { kind: "insertVertex", index: 0, atM: [10, 0] },
    );

    expect(wallIds(document)).toEqual([
      "wall_0",
      "wall_4",
      "wall_1",
      "wall_2",
      "wall_3",
    ]);

    const geometry = compile(document);
    expect(
      geometry.surfaces.filter((s) => s.type === "wall").map((s) => s.id),
    ).toEqual(["wall_0", "wall_1", "wall_2", "wall_3", "wall_4"]);
    expect(geometry.openings[0].surfaceId).toBe("wall_3");
    expect(roomGeometrySchema.safeParse(geometry).success).toBe(true);
  });
});
