// src/features/room-editor/validation/scene-status.ts — la geometría mueve el estado de la escena.
// Puro: recibe el veredicto del validador y devuelve el estado, sin tocar BD. Gemelo de
// signal-flow/validation/scene-status.ts, que gobierna el otro tramo de la misma máquina.

import type { SceneStatus } from "@/features/scenes/schemas";

/**
 * Transiciones de la Sección 08 en la parte que gobierna el recinto.
 *
 * No sabe nada del grafo, y por eso solo promueve desde FLOW_READY: una geometría impecable sobre un
 * sistema roto deja la escena en DRAFT, que es donde el validador del flujo la dejó. Al revés,
 * romper la planta cae a FLOW_READY y no a DRAFT — el sistema sigue siendo válido y hacerle
 * revalidar el grafo al usuario por haber movido un vértice sería mentirle sobre qué está mal.
 * Los resultados ya calculados no se borran: quedan marcados como desactualizados.
 */
export function nextSceneStatusFromRoom(
  current: SceneStatus,
  isRoomComplete: boolean,
): SceneStatus {
  if (isRoomComplete) {
    return current === "FLOW_READY" ? "ROOM_READY" : current;
  }
  return current === "DRAFT" ? "DRAFT" : "FLOW_READY";
}
