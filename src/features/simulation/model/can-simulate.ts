// src/features/simulation/model/can-simulate.ts — qué falta para poder simular.
//
// El botón "Simular" se habilita en ROOM_READY (§08), pero ROOM_READY no basta para COMPILAR: se
// llega a ese estado con superficies sin material (MATERIAL_NOT_ASSIGNED es aviso, no error) y el
// contrato exige `materialId` en todas y su MaterialSpec en el diccionario. Antes que inventar un
// material por defecto —coeficientes que nadie eligió, contra la "precisión honesta" del §01— se
// pide asignarlos, y este módulo es el que lo dice con nombre y apellido en la UI.
//
// Devuelve TODAS las razones, no la primera: son cosas que se arreglan en pantallas distintas y
// descubrirlas de una en una obligaría a ir y volver.

import type { RoomDocument } from "@/features/room-editor/schemas/room-document";
import type { SceneStatus } from "@/features/scenes/schemas";

export type SimulationBlockerCode =
  | "SCENE_NOT_READY"
  | "MATERIAL_NOT_ASSIGNED"
  | "NO_SIMULATED_SPEAKER";

export type SimulationBlocker = {
  code: SimulationBlockerCode;
  message: string;
};

export type SimulationReadiness = {
  canSimulate: boolean;
  blockers: SimulationBlocker[];
};

export function canSimulate(input: {
  sceneStatus: SceneStatus;
  document: RoomDocument;
  speakerCount: number;
}): SimulationReadiness {
  const blockers: SimulationBlocker[] = [];

  if (input.sceneStatus !== "ROOM_READY" && input.sceneStatus !== "SIMULATED") {
    blockers.push({
      code: "SCENE_NOT_READY",
      message: "El recinto todavía no está listo: completá la geometría.",
    });
  }

  const unassigned = input.document.surfaces.filter(
    (surface) => surface.materialId === null,
  ).length;
  if (unassigned > 0) {
    blockers.push({
      code: "MATERIAL_NOT_ASSIGNED",
      message: `Faltan materiales en ${unassigned} superficie${unassigned === 1 ? "" : "s"}: sin ellos no hay coeficientes que simular.`,
    });
  }

  if (input.speakerCount === 0) {
    blockers.push({
      code: "NO_SIMULATED_SPEAKER",
      message: "Ninguna caja llega al nodo de simulación en el flujo de señal.",
    });
  }

  return { canSimulate: blockers.length === 0, blockers };
}
