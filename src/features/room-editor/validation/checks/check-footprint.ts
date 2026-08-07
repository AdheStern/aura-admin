// src/features/room-editor/validation/checks/check-footprint.ts — ¿la planta describe un recinto?
// Es el primer check y el que apaga a los demás: sin polígono cerrado y simple no hay superficies
// que extruir, y §5.2 lo exige explícitamente antes de pasar a 3D.

import {
  degenerateEdgeIndexes,
  isCcw,
  MIN_FOOTPRINT_VERTICES,
  polygonAreaM2,
} from "@/features/room-editor/model/polygon-2d";
import {
  type RoomIssue,
  roomIssue,
} from "@/features/room-editor/validation/issue-codes";
import type { RoomIndex } from "@/features/room-editor/validation/room-index";

/** Media rejilla: dos clicks más juntos que esto son el mismo punto para el editor. */
const MIN_EDGE_LENGTH_M = 0.05;

// Por debajo de 1 m² no es una sala sino un arrastre accidental. El límite es deliberadamente laxo:
// quien dibuje una cabina de 1.5 m² tiene derecho a simularla aunque el resultado sea pobre.
const MIN_ROOM_AREA_M2 = 1;

export function checkFootprint(index: RoomIndex): RoomIssue[] {
  const { footprint } = index;

  if (footprint.length < MIN_FOOTPRINT_VERTICES) {
    return [
      roomIssue(
        "FOOTPRINT_TOO_FEW_VERTICES",
        `La planta tiene ${footprint.length} vértices: cierra la polilínea con al menos 3.`,
        { kind: "footprint" },
      ),
    ];
  }

  const degenerate = degenerateEdges(footprint);

  // Área y sentido de giro solo significan algo en un polígono simple: en una pajarita el cordón de
  // zapato resta los dos lóbulos y devolvería un área ridícula o un sentido inventado.
  return index.isFootprintUsable
    ? [...degenerate, ...area(footprint), ...orientation(footprint)]
    : [...degenerate, ...selfIntersection()];
}

function degenerateEdges(footprint: RoomIndex["footprint"]): RoomIssue[] {
  return degenerateEdgeIndexes(footprint, MIN_EDGE_LENGTH_M).map((index) =>
    roomIssue(
      "FOOTPRINT_DEGENERATE_EDGE",
      "Dos vértices consecutivos están en el mismo punto: borra uno de los dos.",
      { kind: "vertex", index },
    ),
  );
}

function selfIntersection(): RoomIssue[] {
  return [
    roomIssue(
      "FOOTPRINT_SELF_INTERSECTS",
      "La planta se cruza consigo misma: el recinto no tiene un interior definido.",
      { kind: "footprint" },
    ),
  ];
}

function area(footprint: RoomIndex["footprint"]): RoomIssue[] {
  const areaM2 = polygonAreaM2(footprint);
  return areaM2 >= MIN_ROOM_AREA_M2
    ? []
    : [
        roomIssue(
          "FOOTPRINT_AREA_TOO_SMALL",
          `La planta encierra ${areaM2.toFixed(2)} m²: revisa la escala del dibujo.`,
          { kind: "footprint" },
        ),
      ];
}

// Red de bugs, no algo que el usuario pueda provocar: el comando setFootprint normaliza el sentido
// al cerrar la planta. Si esto salta, el documento se editó saltándose el historial.
function orientation(footprint: RoomIndex["footprint"]): RoomIssue[] {
  return isCcw(footprint)
    ? []
    : [
        roomIssue(
          "FOOTPRINT_NOT_CCW",
          "La planta está en sentido horario y el contrato la exige antihoraria.",
          { kind: "footprint" },
        ),
      ];
}
