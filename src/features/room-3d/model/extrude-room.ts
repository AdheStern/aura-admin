// src/features/room-3d/model/extrude-room.ts — RoomDocument → geometría 3D (Fase 4, Tarea 1).
//
// Extrusión recta del footprint a `height.h`: sin CSG real (§5.3, KISS de v1) — pilares y
// aberturas se superponen en vez de restar/agujerear la malla, igual que ya asume el compilador
// al contrato (to-room-geometry.ts). Cada pieza lleva su RoomSelection para que el picking del
// canvas 3D solo tenga que decodificar qué malla tocó, nunca adivinar a qué pertenece.
//
// El cambio de marco (contrato Z-up → three.js Y-up) lo hace model/scene-frame.ts, en un solo sitio.
//
// TODAS las normales apuntan hacia DENTRO del recinto, y de eso depende que la sala se pueda usar:
// pintadas con `side: FrontSide`, las caras entre la cámara y el interior quedan descartadas y el
// recinto se ve como una casa de muñecas abierta desde cualquier ángulo. Sin esto la sala es una
// caja opaca y no hay forma de ver —ni de clicar— un parlante colocado dentro. Por eso el piso se
// triangula al revés que el techo, y por eso una abertura se separa de su muro hacia dentro.

import {
  type ScenePoint,
  toScenePlanPoint,
} from "@/features/room-3d/model/scene-frame";
import {
  inwardNormalM,
  polygonEdges,
} from "@/features/room-editor/model/polygon-2d";
import {
  wallEdgeIndexOf,
  wallSurfaces,
} from "@/features/room-editor/model/wall-surfaces";
import type {
  Point2d,
  Polygon2d,
  RoomDocument,
} from "@/features/room-editor/schemas/room-document";
import type { RoomSelection } from "@/features/room-editor/store/room-selection";

export type Point3d = ScenePoint;

export type WallPiece = {
  selection: Extract<RoomSelection, { kind: "surface" }>;
  materialId: string | null;
  /** Esquinas del quad: inferior-desde, inferior-hasta, superior-hasta, superior-desde. */
  corners: readonly [Point3d, Point3d, Point3d, Point3d];
};

export type FloorCeilingPiece = {
  selection: Extract<RoomSelection, { kind: "surface" }>;
  materialId: string | null;
  triangles: readonly (readonly [Point3d, Point3d, Point3d])[];
};

export type ObstaclePiece = {
  selection: Extract<RoomSelection, { kind: "obstacle" }>;
  materialId: string | null;
  shape: "rect" | "circle";
  centerM: Point2d;
  sizeM: readonly number[];
  heightM: number;
};

export type OpeningPiece = {
  selection: Extract<RoomSelection, { kind: "opening" }>;
  materialId: string | null;
  corners: readonly [Point3d, Point3d, Point3d, Point3d];
};

export type ExtrudedRoom = {
  walls: readonly WallPiece[];
  floor: FloorCeilingPiece;
  ceiling: FloorCeilingPiece;
  obstacles: readonly ObstaclePiece[];
  openings: readonly OpeningPiece[];
};

/** Cuánto se separa una abertura de su muro para no competir por los mismos píxeles (z-fighting):
 *  es una superposición visual, no una resta de la malla, y a distancia real de sala es invisible.
 *  Va hacia DENTRO porque la sala se mira desde dentro (ver la nota de las normales más abajo). */
const OPENING_OFFSET_M = 0.01;

export function extrudeRoom(document: RoomDocument): ExtrudedRoom {
  const { vertices } = document.footprint;
  const heightM = document.height.h;

  return {
    walls: extrudeWalls(document, vertices, heightM),
    // El piso mira hacia arriba y el techo hacia abajo: los dos, hacia dentro.
    floor: extrudeFloorOrCeiling(document, vertices, "floor", 0, true),
    ceiling: extrudeFloorOrCeiling(
      document,
      vertices,
      "ceiling",
      heightM,
      false,
    ),
    obstacles: extrudeObstacles(document, heightM),
    openings: extrudeOpenings(document, vertices),
  };
}

function extrudeWalls(
  document: RoomDocument,
  vertices: Polygon2d,
  heightM: number,
): WallPiece[] {
  const walls = wallSurfaces(document.surfaces);

  return polygonEdges(vertices).map((edge) => {
    const wall = walls[edge.index];
    return {
      selection: { kind: "surface", id: wall.id },
      materialId: wall.materialId,
      corners: [
        toScenePlanPoint(edge.from, 0),
        toScenePlanPoint(edge.to, 0),
        toScenePlanPoint(edge.to, heightM),
        toScenePlanPoint(edge.from, heightM),
      ],
    };
  });
}

function extrudeFloorOrCeiling(
  document: RoomDocument,
  vertices: Polygon2d,
  type: "floor" | "ceiling",
  elevationM: number,
  reversed: boolean,
): FloorCeilingPiece {
  const surface = document.surfaces.find((s) => s.type === type);
  if (!surface) throw new Error(`El documento no tiene superficie "${type}"`);

  const fan: [Point2d, Point2d, Point2d][] = [];
  for (let i = 1; i < vertices.length - 1; i++) {
    const triangle: [Point2d, Point2d, Point2d] = reversed
      ? [vertices[0], vertices[i + 1], vertices[i]]
      : [vertices[0], vertices[i], vertices[i + 1]];
    fan.push(triangle);
  }

  return {
    selection: { kind: "surface", id: surface.id },
    materialId: surface.materialId,
    triangles: fan.map(
      (triangle) =>
        triangle.map((p) => toScenePlanPoint(p, elevationM)) as [
          Point3d,
          Point3d,
          Point3d,
        ],
    ),
  };
}

function extrudeObstacles(
  document: RoomDocument,
  heightM: number,
): ObstaclePiece[] {
  return document.obstacles.map((obstacle) => ({
    selection: { kind: "obstacle", id: obstacle.id },
    materialId: obstacle.materialId,
    shape: obstacle.shape,
    centerM: obstacle.at,
    sizeM: obstacle.size,
    heightM,
  }));
}

function extrudeOpenings(
  document: RoomDocument,
  vertices: Polygon2d,
): OpeningPiece[] {
  const edges = polygonEdges(vertices);

  return document.openings.flatMap((opening) => {
    const edgeIndex = wallEdgeIndexOf(document.surfaces, opening.surfaceId);
    if (edgeIndex === null) return [];
    return [openingPiece(opening, edges[edgeIndex], vertices)];
  });
}

function openingPiece(
  opening: RoomDocument["openings"][number],
  edge: { from: Point2d; to: Point2d },
  vertices: Polygon2d,
): OpeningPiece {
  const lengthM =
    Math.hypot(edge.to[0] - edge.from[0], edge.to[1] - edge.from[1]) || 1;
  const dir: Point2d = [
    (edge.to[0] - edge.from[0]) / lengthM,
    (edge.to[1] - edge.from[1]) / lengthM,
  ];
  const [inX, inY] = inwardNormalM(edge, vertices);
  const inward: Point2d = [inX * OPENING_OFFSET_M, inY * OPENING_OFFSET_M];

  const [x, y, w, h] = opening.rect;
  const along = (distanceM: number): Point2d => [
    edge.from[0] + dir[0] * distanceM + inward[0],
    edge.from[1] + dir[1] * distanceM + inward[1],
  ];

  return {
    selection: { kind: "opening", id: opening.id },
    materialId: opening.materialId,
    corners: [
      toScenePlanPoint(along(x), y),
      toScenePlanPoint(along(x + w), y),
      toScenePlanPoint(along(x + w), y + h),
      toScenePlanPoint(along(x), y + h),
    ],
  };
}
