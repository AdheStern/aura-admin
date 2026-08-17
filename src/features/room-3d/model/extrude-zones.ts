// src/features/room-3d/model/extrude-zones.ts — zonas de audiencia y escenario, del documento a
// triángulos en el marco de three.js.
//
// Existen en el 3D porque colocar una caja es apuntarla a la gente: sin ver dónde está el público
// ni hasta dónde llega el escenario, orientar un parlante en esta vista es adivinar.
//
// El escenario se levanta a su `elevation` (tapa + laterales) y la audiencia se queda pegada al
// piso: la altura de oído no se dibuja a propósito, un plano flotando a 1.2 m cortaría las cajas
// y taparía media sala, la misma razón por la que el mapa de cobertura va sobre el suelo.
//
// Abanico desde el primer vértice, igual que el piso en extrude-room.ts: correcto para polígonos
// convexos, que es lo que dibuja la herramienta de zonas. Uno cóncavo se rellenaría de más.

import {
  type ScenePoint,
  toScenePlanPoint,
} from "@/features/room-3d/model/scene-frame";
import { polygonEdges } from "@/features/room-editor/model/polygon-2d";
import type {
  Polygon2d,
  RoomDocument,
} from "@/features/room-editor/schemas/room-document";

export type ZoneTriangle = readonly [ScenePoint, ScenePoint, ScenePoint];

export type ZonePiece = {
  id: string;
  /** Tapa superior y, si la zona levanta del suelo, sus caras laterales. */
  triangles: readonly ZoneTriangle[];
  /** Contorno cerrado del perímetro, para dibujar el borde. */
  outline: readonly ScenePoint[];
};

export type ExtrudedZones = {
  audience: readonly ZonePiece[];
  stage: ZonePiece | null;
};

/** Justo encima del piso: a la misma cota la zona y el suelo pelean por el mismo píxel y parpadean.
 *  Por DEBAJO del mapa de cobertura (0.02 m) a propósito — con el mapa encendido manda el mapa. */
const HOVER_M = 0.01;

/** El contorno va por encima de su relleno y del mapa de cobertura: cuando el mapa tapa la mancha,
 *  el borde es lo único que sigue diciendo dónde acaba la zona. */
const OUTLINE_LIFT_M = 0.02;

export function extrudeZones(document: RoomDocument): ExtrudedZones {
  const { stage, audience } = document.zones;

  return {
    audience: audience.map((zone) => zonePiece(zone.id, zone.polygon, HOVER_M)),
    stage: stage
      ? zonePiece(stage.id, stage.polygon, Math.max(stage.elevation, HOVER_M))
      : null,
  };
}

function zonePiece(id: string, polygon: Polygon2d, topM: number): ZonePiece {
  return {
    id,
    triangles: [
      ...capTriangles(polygon, topM),
      ...sideTriangles(polygon, topM),
    ],
    outline: polygon.map((point) =>
      toScenePlanPoint(point, topM + OUTLINE_LIFT_M),
    ),
  };
}

function capTriangles(polygon: Polygon2d, topM: number): ZoneTriangle[] {
  const triangles: ZoneTriangle[] = [];

  for (let i = 1; i < polygon.length - 1; i++) {
    triangles.push([
      toScenePlanPoint(polygon[0], topM),
      toScenePlanPoint(polygon[i], topM),
      toScenePlanPoint(polygon[i + 1], topM),
    ]);
  }

  return triangles;
}

/** Las paredes del pedestal. Vacías cuando la zona es una mancha en el suelo (toda la audiencia, y
 *  un escenario a ras). */
function sideTriangles(polygon: Polygon2d, topM: number): ZoneTriangle[] {
  if (topM <= HOVER_M) return [];

  return polygonEdges(polygon).flatMap((edge): ZoneTriangle[] => [
    [
      toScenePlanPoint(edge.from, 0),
      toScenePlanPoint(edge.to, 0),
      toScenePlanPoint(edge.to, topM),
    ],
    [
      toScenePlanPoint(edge.from, 0),
      toScenePlanPoint(edge.to, topM),
      toScenePlanPoint(edge.from, topM),
    ],
  ]);
}
