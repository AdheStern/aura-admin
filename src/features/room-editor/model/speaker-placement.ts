// src/features/room-editor/model/speaker-placement.ts — resuelve DÓNDE está cada caja.
//
// El documento solo guarda las colocaciones que el usuario tocó; el resto se calculan aquí. Esa
// asimetría es deliberada: abrir el editor 3D no puede escribir en la escena (un autosave al abrir
// una página, y una entrada de historial que el usuario no provocó), y a la vez ninguna fuente
// puede quedarse sin posición o el compilador de SimulationRequest no tendría qué mandarle al
// motor. Un defecto determinista y calculado al vuelo resuelve las dos cosas.
//
// LIMITACIÓN del defecto: reparte las cajas sobre el frente de la CAJA ENVOLVENTE de la planta, no
// del polígono. En una planta en L el frente de la envolvente puede caer fuera del recinto, y ahí
// salta el aviso SPEAKER_OUTSIDE_ROOM. Es el punto de partida de un arrastre, no una propuesta de
// montaje: acertar de verdad exigiría saber dónde mira el escenario, que el documento no dice.

import { polygonCentroidM } from "@/features/room-editor/model/polygon-2d";
import type {
  Polygon2d,
  RoomDocument,
  RoomSpeaker,
} from "@/features/room-editor/schemas/room-document";

/** Separación del frente de la envolvente hacia dentro: pegar la caja al muro la haría inseleccionable. */
const FRONT_INSET_M = 1;

/** Altura de vuelo típica, recortada en salas bajas para no atravesar el techo. */
const FLYING_HEIGHT_M = 3;
const MAX_HEIGHT_FRACTION = 0.75;

/**
 * Una colocación por `nodeId`, en el orden recibido: la guardada si existe, si no la de por defecto.
 * Es el único punto de entrada — nadie debería leer `document.speakers` directamente, o vería solo
 * las cajas movidas a mano.
 */
export function resolveSpeakerPlacements(
  document: RoomDocument,
  nodeIds: readonly string[],
): RoomSpeaker[] {
  const stored = new Map(
    document.speakers.map((speaker) => [speaker.nodeId, speaker]),
  );

  return nodeIds.map(
    (nodeId, index) =>
      stored.get(nodeId) ??
      defaultSpeakerPlacement(document, nodeId, index, nodeIds.length),
  );
}

export function isSpeakerPlaced(
  document: RoomDocument,
  nodeId: string,
): boolean {
  return document.speakers.some((speaker) => speaker.nodeId === nodeId);
}

export function defaultSpeakerPlacement(
  document: RoomDocument,
  nodeId: string,
  index: number,
  count: number,
): RoomSpeaker {
  const { vertices } = document.footprint;
  if (vertices.length === 0) {
    return { nodeId, position: [0, 0, 0], rotationDeg: zeroRotation() };
  }

  const [minX, minY, maxX] = boundsOf(vertices);
  // Repartidas en los huecos interiores: con dos cajas quedan a 1/3 y 2/3 del ancho, nunca en las
  // esquinas ni encimadas una sobre otra.
  const fraction = (index + 1) / (count + 1);
  const x = minX + (maxX - minX) * fraction;
  const y = minY + FRONT_INSET_M;
  const z = Math.min(FLYING_HEIGHT_M, document.height.h * MAX_HEIGHT_FRACTION);

  return {
    nodeId,
    position: [x, y, z],
    rotationDeg: { ...zeroRotation(), yaw: yawTowardCentroid(vertices, x, y) },
  };
}

function zeroRotation(): RoomSpeaker["rotationDeg"] {
  return { yaw: 0, pitch: 0, roll: 0 };
}

/** Apuntando al centro de la planta, que es lo único que se puede suponer sin saber del escenario. */
function yawTowardCentroid(vertices: Polygon2d, x: number, y: number): number {
  const [cx, cy] = polygonCentroidM(vertices);
  return (Math.atan2(cy - y, cx - x) * 180) / Math.PI;
}

function boundsOf(vertices: Polygon2d): [number, number, number, number] {
  const xs = vertices.map(([x]) => x);
  const ys = vertices.map(([, y]) => y);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
