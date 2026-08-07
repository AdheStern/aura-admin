// src/features/room-editor/validation/checks/check-speakers.ts — las cajas colocadas en el recinto.
//
// Solo mira las colocaciones GUARDADAS: las que el usuario no tocó las resuelve
// model/speaker-placement.ts al vuelo y por construcción caen dentro de la envolvente, así que
// avisar de ellas sería avisar de una posición que el usuario no eligió.
//
// El validador no ve el grafo (recibe documento y catálogo de materiales, nada más), así que una
// colocación cuyo nodo `speaker` ya no existe no se puede detectar aquí y tampoco hace falta: es
// inerte, el editor 3D y el compilador iteran sobre los nodos del grafo, no sobre esta lista.

import { pointInPolygon } from "@/features/room-editor/model/polygon-topology";
import {
  type RoomIssue,
  roomIssue,
} from "@/features/room-editor/validation/issue-codes";
import type { RoomIndex } from "@/features/room-editor/validation/room-index";

export function checkSpeakers(index: RoomIndex): RoomIssue[] {
  if (!index.isFootprintUsable) return [];

  return index.document.speakers
    .filter((speaker) => isOutsideRoom(index, speaker.position))
    .map((speaker) =>
      roomIssue(
        "SPEAKER_OUTSIDE_ROOM",
        "El parlante quedó fuera del recinto: su energía no entra por ninguna superficie.",
        { kind: "speaker", id: speaker.nodeId },
      ),
    );
}

function isOutsideRoom(
  index: RoomIndex,
  [x, y, z]: readonly [number, number, number],
): boolean {
  // El suelo y el techo cuentan como dentro: una caja apoyada en el piso o colgada del techo es un
  // montaje corriente, igual que un pilar tangente al muro en check-obstacles.
  if (z < 0 || z > index.document.height.h) return true;
  return pointInPolygon([x, y], index.footprint) === "outside";
}
