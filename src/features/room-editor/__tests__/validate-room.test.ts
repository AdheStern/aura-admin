// src/features/room-editor/__tests__/validate-room.test.ts — el veredicto que abre ROOM_READY.
// La primera prueba es la que importa: una sala correcta tiene que dar cero errores Y cero avisos,
// porque un validador que regaña sobre una sala bien dibujada se ignora y deja de proteger nada.

import { describe, expect, it } from "vitest";
import {
  applyAll,
  assignAllMaterials,
  audienceZone,
  buildRoom,
  canonRoom,
  catalogWith,
  circlePillar,
  FIXTURE_MATERIAL_ID,
  rectPillar,
  rectVertices,
  windowOpening,
} from "@/features/room-editor/__tests__/fixtures/room-builder";
import type { RoomCommand } from "@/features/room-editor/schemas/room-command";
import {
  EMPTY_ROOM,
  type RoomDocument,
} from "@/features/room-editor/schemas/room-document";
import type { RoomIssue } from "@/features/room-editor/validation/issue-codes";
import { nextSceneStatusFromRoom } from "@/features/room-editor/validation/scene-status";
import { validateRoom } from "@/features/room-editor/validation/validate-room";

const CATALOG = catalogWith("mat_canon", "mat_brick");

const VERTICES = rectVertices(20, 12);
const AUDIENCE: RoomCommand = {
  kind: "insertAudienceZone",
  index: 0,
  zone: audienceZone("zone_1", rectVertices(16, 10)),
};

function codes(issues: RoomIssue[]): string[] {
  return issues.map((issue) => issue.code);
}

function validate(document: RoomDocument) {
  return validateRoom(document, CATALOG);
}

/**
 * Sala válida sobre la que cada prueba introduce un solo problema. Los materiales se reparten antes
 * de aplicar los comandos de la prueba, para que una que asigne el suyo no lo pierda.
 */
function room(...commands: RoomCommand[]): RoomDocument {
  const base = assignAllMaterials(
    buildRoom(
      { kind: "setFootprint", vertices: VERTICES },
      { kind: "setHeight", heightM: 6 },
      AUDIENCE,
    ),
    FIXTURE_MATERIAL_ID,
  );
  return applyAll(base, ...commands);
}

describe("sala correcta", () => {
  it("no reporta nada sobre la sala de CANON-01 con materiales asignados", () => {
    const validation = validate(
      assignAllMaterials(canonRoom(), FIXTURE_MATERIAL_ID),
    );

    expect(validation.errors).toEqual([]);
    expect(validation.warnings).toEqual([]);
    expect(validation.isComplete).toBe(true);
  });

  // Es el estado en que el editor 2D deja toda sala: los materiales se reparten en el 3D (Fase 4).
  it("solo avisa de los materiales sin asignar cuando aún no se repartieron", () => {
    const validation = validate(canonRoom());

    expect(validation.errors).toEqual([]);
    expect(codes(validation.warnings)).toEqual(["MATERIAL_NOT_ASSIGNED"]);
    expect(validation.isComplete).toBe(true);
  });
});

describe("planta", () => {
  it("bloquea la escena recién creada por planta y audiencia", () => {
    const validation = validate(EMPTY_ROOM);

    expect(codes(validation.errors)).toEqual([
      "FOOTPRINT_TOO_FEW_VERTICES",
      "NO_AUDIENCE_ZONE",
    ]);
    expect(validation.isComplete).toBe(false);
  });

  // Con la planta rota, "la zona se sale del recinto" sería ruido derivado del primer error y no un
  // problema que el usuario pueda arreglar por su cuenta.
  it("no encadena errores de contención cuando la planta se cruza consigo misma", () => {
    const bowtie = buildRoom(
      {
        kind: "setFootprint",
        vertices: [
          [0, 0],
          [10, 10],
          [10, 0],
          [0, 10],
        ],
      },
      AUDIENCE,
    );
    const validation = validate(bowtie);

    expect(codes(validation.errors)).toContain("FOOTPRINT_SELF_INTERSECTS");
    expect(codes(validation.errors)).not.toContain("ZONE_OUTSIDE_FOOTPRINT");
  });
});

describe("zonas", () => {
  it("rechaza una audiencia que se sale del recinto", () => {
    const outside = room({
      kind: "replaceAudienceZone",
      zone: audienceZone("zone_1", rectVertices(24, 10)),
    });

    expect(codes(validate(outside).errors)).toEqual(["ZONE_OUTSIDE_FOOTPRINT"]);
  });

  it("rechaza una altura de oído por encima del techo", () => {
    const tooHigh = room({
      kind: "replaceAudienceZone",
      zone: audienceZone("zone_1", rectVertices(16, 10), { earHeight: 7 }),
    });

    expect(codes(validate(tooHigh).errors)).toEqual([
      "EAR_HEIGHT_ABOVE_CEILING",
    ]);
  });

  it("avisa del solape entre escenario y audiencia", () => {
    const overlapping = room({
      kind: "setStage",
      stage: { id: "stage_1", polygon: rectVertices(6, 6), elevation: 0.8 },
    });

    expect(codes(validate(overlapping).warnings)).toEqual(["ZONES_OVERLAP"]);
  });
});

describe("pilares", () => {
  it("rechaza el pilar que asoma fuera del recinto", () => {
    const outside = room({
      kind: "insertObstacle",
      index: 0,
      obstacle: rectPillar("p1", [19.9, 6]),
    });

    expect(codes(validate(outside).errors)).toEqual([
      "OBSTACLE_OUTSIDE_FOOTPRINT",
    ]);
  });

  it("avisa de dos pilares que se pisan y del que cae sobre la audiencia", () => {
    const stacked = room(
      { kind: "insertObstacle", index: 0, obstacle: rectPillar("p1", [8, 5]) },
      {
        kind: "insertObstacle",
        index: 1,
        obstacle: circlePillar("p2", [8.2, 5]),
      },
    );

    expect(codes(validate(stacked).warnings)).toEqual([
      "OBSTACLES_OVERLAP",
      "OBSTACLE_OVER_AUDIENCE",
      "OBSTACLE_OVER_AUDIENCE",
    ]);
  });
});

describe("aberturas", () => {
  it("rechaza la abertura colgada de un muro inexistente", () => {
    const dangling = room({
      kind: "insertOpening",
      index: 0,
      opening: windowOpening("op_1", "wall_9"),
    });

    expect(codes(validate(dangling).errors)).toEqual([
      "OPENING_SURFACE_MISSING",
    ]);
  });

  it("rechaza la abertura que no cabe a lo largo del muro", () => {
    const tooWide = room({
      kind: "insertOpening",
      index: 0,
      opening: windowOpening("op_1", "wall_1", [3, 1.2, 12, 1.5]),
    });

    expect(codes(validate(tooWide).errors)).toEqual(["OPENING_OUT_OF_BOUNDS"]);
  });

  it("avisa del muro que es más vidrio que muro", () => {
    const glassed = room({
      kind: "insertOpening",
      index: 0,
      opening: windowOpening("op_1", "wall_1", [0, 0, 11, 5]),
    });

    expect(codes(validate(glassed).warnings)).toEqual([
      "OPENING_AREA_EXCESSIVE",
    ]);
  });
});

describe("catálogo y cotas", () => {
  it("rechaza un material que ya no está en el catálogo", () => {
    const orphan = room({
      kind: "setSurfaceMaterial",
      surfaceId: "wall_0",
      materialId: "mat_borrado",
    });

    expect(codes(validate(orphan).errors)).toEqual(["MATERIAL_MISSING"]);
  });

  it("avisa de una altura fuera de lo habitual", () => {
    expect(
      codes(validate(room({ kind: "setHeight", heightM: 45 })).warnings),
    ).toEqual(["ROOM_HEIGHT_UNUSUAL"]);
  });
});

describe("estado de la escena", () => {
  it("solo promueve a ROOM_READY desde FLOW_READY", () => {
    expect(nextSceneStatusFromRoom("FLOW_READY", true)).toBe("ROOM_READY");
    expect(nextSceneStatusFromRoom("DRAFT", true)).toBe("DRAFT");
    expect(nextSceneStatusFromRoom("SIMULATED", true)).toBe("SIMULATED");
  });

  it("degrada a FLOW_READY —no a DRAFT— cuando la geometría se rompe", () => {
    expect(nextSceneStatusFromRoom("ROOM_READY", false)).toBe("FLOW_READY");
    expect(nextSceneStatusFromRoom("SIMULATED", false)).toBe("FLOW_READY");
    expect(nextSceneStatusFromRoom("DRAFT", false)).toBe("DRAFT");
  });
});
