// src/features/room-editor/validation/checks/check-obstacles.ts — los pilares.
//
// Que un pilar tape butacas no es un error de dibujo sino la situación que el cliente paga por
// descubrir, así que es aviso: v1 los aproxima como absorción/dispersión repartida más la sombra
// del rayo directo (callout de §5.3), y esa sombra es justo lo que hay que mirar en el resultado.

import {
  doesObstacleOverlapPolygon,
  doObstaclesOverlap,
  isObstacleInsidePolygon,
} from "@/features/room-editor/model/obstacle-geometry";
import {
  type RoomIssue,
  roomIssue,
} from "@/features/room-editor/validation/issue-codes";
import type { RoomIndex } from "@/features/room-editor/validation/room-index";

export function checkObstacles(index: RoomIndex): RoomIssue[] {
  return [
    ...outsideFootprint(index),
    ...overlappingPairs(index),
    ...overAudience(index),
  ];
}

function outsideFootprint(index: RoomIndex): RoomIssue[] {
  if (!index.isFootprintUsable) return [];

  return index.document.obstacles
    .filter((obstacle) => !isObstacleInsidePolygon(obstacle, index.footprint))
    .map((obstacle) =>
      roomIssue(
        "OBSTACLE_OUTSIDE_FOOTPRINT",
        "El pilar asoma fuera del recinto: el motor no sabría qué hace ahí.",
        { kind: "obstacle", id: obstacle.id },
      ),
    );
}

function overlappingPairs(index: RoomIndex): RoomIssue[] {
  const { obstacles } = index.document;
  const issues: RoomIssue[] = [];

  for (const [position, obstacle] of obstacles.entries()) {
    for (const other of obstacles.slice(position + 1)) {
      if (!doObstaclesOverlap(obstacle, other)) continue;
      issues.push(
        roomIssue(
          "OBSTACLES_OVERLAP",
          "Dos pilares ocupan el mismo sitio: su absorción se contaría dos veces.",
          { kind: "obstacle", id: obstacle.id },
        ),
      );
    }
  }
  return issues;
}

function overAudience(index: RoomIndex): RoomIssue[] {
  return index.document.obstacles
    .filter((obstacle) =>
      index.document.zones.audience.some((zone) =>
        doesObstacleOverlapPolygon(obstacle, zone.polygon),
      ),
    )
    .map((obstacle) =>
      roomIssue(
        "OBSTACLE_OVER_AUDIENCE",
        "El pilar cae dentro de la audiencia: habrá puntos de escucha en su sombra.",
        { kind: "obstacle", id: obstacle.id },
      ),
    );
}
