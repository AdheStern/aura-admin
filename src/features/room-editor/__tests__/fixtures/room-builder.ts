// src/features/room-editor/__tests__/fixtures/room-builder.ts — salas de prueba.
// Se construyen EJECUTANDO comandos, no escribiendo el documento a mano: así las fixtures pasan por
// el mismo camino que el editor y un comando que deje el documento incoherente (muros descuadrados,
// aberturas colgando) rompe los tests de todo el mundo, no solo los suyos.

import { applyRoomCommand } from "@/features/room-editor/history/apply-room-command";
import type { RoomCommand } from "@/features/room-editor/schemas/room-command";
import {
  EMPTY_ROOM,
  type Polygon2d,
  type RoomDocument,
  type RoomObstacle,
  type RoomOpening,
  type RoomZone,
} from "@/features/room-editor/schemas/room-document";
import type { RoomCatalog } from "@/features/room-editor/validation/room-index";

/** Material por defecto de las fixtures: el sintético de CANON-01. */
export const FIXTURE_MATERIAL_ID = "mat_canon";

export function buildRoom(...commands: RoomCommand[]): RoomDocument {
  return applyAll(EMPTY_ROOM, ...commands);
}

export function applyAll(
  document: RoomDocument,
  ...commands: RoomCommand[]
): RoomDocument {
  return commands.reduce(buildOn, document);
}

function buildOn(document: RoomDocument, command: RoomCommand): RoomDocument {
  const result = applyRoomCommand(document, command);
  if (!result) {
    throw new Error(`Comando de fixture sin efecto: ${command.kind}`);
  }
  return result.next;
}

export function rectVertices(widthM: number, depthM: number): Polygon2d {
  return [
    [0, 0],
    [widthM, 0],
    [widthM, depthM],
    [0, depthM],
  ];
}

export function audienceZone(
  id: string,
  polygon: Polygon2d,
  overrides: Partial<Omit<RoomZone, "id" | "polygon">> = {},
): RoomZone {
  return { id, polygon, earHeight: 1.2, seated: true, ...overrides };
}

// Pilares y aberturas nacen CON material: al dibujarlos el editor ya sabe de qué son, y dejarlos a
// null obligaría a cada test de geometría a convivir con el aviso de materiales sin asignar.
export function rectPillar(
  id: string,
  atM: [number, number],
  sizeM: [number, number] = [0.6, 0.6],
): RoomObstacle {
  return {
    id,
    type: "pillar",
    shape: "rect",
    at: atM,
    size: sizeM,
    materialId: FIXTURE_MATERIAL_ID,
  };
}

export function circlePillar(
  id: string,
  atM: [number, number],
  radiusM = 0.3,
): RoomObstacle {
  return {
    id,
    type: "pillar",
    shape: "circle",
    at: atM,
    size: [radiusM],
    materialId: FIXTURE_MATERIAL_ID,
  };
}

export function windowOpening(
  id: string,
  surfaceId: string,
  rect: RoomOpening["rect"] = [3, 1.2, 2, 1.5],
): RoomOpening {
  return {
    id,
    type: "window",
    surfaceId,
    rect,
    materialId: FIXTURE_MATERIAL_ID,
  };
}

export function catalogWith(...materialIds: string[]): RoomCatalog {
  return { materialIds: new Set(materialIds) };
}

/** La sala de CANON-01 (§A.1): 20 × 12 × 6 m con la audiencia cubriendo toda la planta. */
export function canonRoom(): RoomDocument {
  const vertices = rectVertices(20, 12);
  return buildRoom(
    { kind: "setFootprint", vertices },
    { kind: "setHeight", heightM: 6 },
    {
      kind: "insertAudienceZone",
      index: 0,
      zone: audienceZone("zone_1", vertices),
    },
  );
}

/** Lo que hará el editor 3D de la Fase 4: repartir material por todas las superficies. */
export function assignAllMaterials(
  document: RoomDocument,
  materialId: string,
): RoomDocument {
  return document.surfaces.reduce(
    (current, surface) =>
      buildOn(current, {
        kind: "setSurfaceMaterial",
        surfaceId: surface.id,
        materialId,
      }),
    document,
  );
}

/** Ids de los muros en orden de arista, que es el orden que el contrato lee. */
export function wallIds(document: RoomDocument): string[] {
  return document.surfaces
    .filter((surface) => surface.type === "wall")
    .map((surface) => surface.id);
}
