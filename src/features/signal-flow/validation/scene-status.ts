// src/features/signal-flow/validation/scene-status.ts — el grafo mueve el estado de la escena.
// Puro: recibe el veredicto del validador y devuelve el estado, sin tocar BD. Quien persiste es la
// action de guardado del editor (tarea 2).

import type { SceneStatus } from "@/features/scenes/schemas";

/**
 * Transiciones de la Sección 08 en la parte que gobierna el flujo de señal.
 *
 * El diagrama solo dibuja FLOW_READY → DRAFT, pero una escena en ROOM_READY o SIMULATED cuyo grafo
 * se rompe tiene que caer también a DRAFT: sin sistema no hay nada que simular, y dejarla en
 * ROOM_READY habilitaría el botón "Simular" sobre un grafo inválido. Los resultados ya calculados
 * no se borran nunca — quedan marcados como desactualizados, que es harina de otro costal.
 */
export function nextSceneStatus(
  current: SceneStatus,
  isFlowComplete: boolean,
): SceneStatus {
  if (!isFlowComplete) return "DRAFT";
  return current === "DRAFT" ? "FLOW_READY" : current;
}
