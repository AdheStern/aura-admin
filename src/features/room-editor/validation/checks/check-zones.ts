// src/features/room-editor/validation/checks/check-zones.ts — dónde se escucha y dónde se toca.
// La zona de audiencia es la que decide si hay simulación: es la grilla de puntos de escucha, así
// que su ausencia es el error que mantiene la escena fuera de ROOM_READY.

import { isSimplePolygon } from "@/features/room-editor/model/polygon-2d";
import {
  isPolygonInsidePolygon,
  polygonsOverlap,
} from "@/features/room-editor/model/polygon-topology";
import type {
  Polygon2d,
  RoomDocument,
} from "@/features/room-editor/schemas/room-document";
import {
  type RoomIssue,
  roomIssue,
} from "@/features/room-editor/validation/issue-codes";
import type { RoomIndex } from "@/features/room-editor/validation/room-index";

type NamedZone = { id: string; polygon: Polygon2d; label: string };

export function checkZones(index: RoomIndex): RoomIssue[] {
  const zones = namedZones(index.document);

  return [
    ...missingAudience(index),
    ...zones.flatMap((zone) => shape(zone, index)),
    ...overlaps(zones),
  ];
}

function missingAudience(index: RoomIndex): RoomIssue[] {
  return index.document.zones.audience.length > 0
    ? []
    : [
        roomIssue(
          "NO_AUDIENCE_ZONE",
          "Sin zona de audiencia no hay puntos de escucha que calcular: dibuja al menos una.",
          { kind: "room" },
        ),
      ];
}

function shape(zone: NamedZone, index: RoomIndex): RoomIssue[] {
  if (!isSimplePolygon(zone.polygon)) {
    return [
      roomIssue(
        "ZONE_NOT_SIMPLE",
        `${zone.label}: el polígono se cruza consigo mismo o tiene menos de 3 vértices.`,
        { kind: "zone", id: zone.id },
      ),
    ];
  }

  // Con la planta rota, "se sale del recinto" no es un problema propio sino el eco del anterior.
  if (!index.isFootprintUsable) return [];

  return isPolygonInsidePolygon(zone.polygon, index.footprint)
    ? []
    : [
        roomIssue(
          "ZONE_OUTSIDE_FOOTPRINT",
          `${zone.label}: parte de la zona queda fuera del recinto.`,
          { kind: "zone", id: zone.id },
        ),
      ];
}

// Solaparse no impide simular —el motor genera la grilla igual— pero duplica puntos de escucha en
// la franja compartida y sesga las métricas de uniformidad hacia esa zona.
function overlaps(zones: NamedZone[]): RoomIssue[] {
  const issues: RoomIssue[] = [];

  for (const [position, zone] of zones.entries()) {
    for (const other of zones.slice(position + 1)) {
      if (!polygonsOverlap(zone.polygon, other.polygon)) continue;
      issues.push(
        roomIssue(
          "ZONES_OVERLAP",
          `${zone.label} se solapa con ${other.label.toLowerCase()}.`,
          { kind: "zone", id: zone.id },
        ),
      );
    }
  }
  return issues;
}

function namedZones(document: RoomDocument): NamedZone[] {
  const { stage, audience } = document.zones;

  return [
    ...(stage ? [{ ...stage, label: "El escenario" }] : []),
    ...audience.map((zone, position) => ({
      ...zone,
      label: `La zona de audiencia ${position + 1}`,
    })),
  ];
}
