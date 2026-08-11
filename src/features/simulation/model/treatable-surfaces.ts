// src/features/simulation/model/treatable-surfaces.ts — cuánta superficie hay donde tratar.
//
// Se calcula sobre la RoomGeometry CONGELADA del `SimulationRequest`, no sobre la escena de hoy:
// los m² que faltan salen de esa sala, y medirlos contra otra daría una sugerencia que no
// corresponde a los números que la acompañan.
//
// Los muros van en orden de arista del footprint — es la convención normativa del contrato, la
// misma de la que depende el motor. Los ids son opacos: manda el ORDEN.
//
// LIMITACIÓN: es el área BRUTA. Ni las aberturas ni los pilares se restan, igual que no se restan
// de la malla en v1 (`opening_approximation`, `pillar_approximation`). Sirve para decir "aquí caben
// 58 m²", que es la pregunta que responde, no para recalcular la absorción de la sala.

import type { RoomGeometry } from "@/contracts";
import {
  edgeLengthM,
  polygonAreaM2,
} from "@/features/room-editor/model/polygon-2d";

export type TreatableSurface = {
  id: string;
  type: "wall" | "floor" | "ceiling";
  label: string;
  areaM2: number;
  materialId: string;
};

export function treatableSurfaces(room: RoomGeometry): TreatableSurface[] {
  const { vertices } = room.footprint;
  const floorAreaM2 = polygonAreaM2(vertices);
  let wallIndex = 0;

  return room.surfaces.map((surface) => {
    const areaM2 =
      surface.type === "wall"
        ? edgeLengthM(vertices, wallIndex++) * room.height.h
        : floorAreaM2;

    return {
      id: surface.id,
      type: surface.type,
      label: labelOf(surface.type, wallIndex),
      areaM2,
      materialId: surface.materialId,
    };
  });
}

/** El piso casi nunca es tratable en la práctica: lo ocupa el público. */
export function isTreatable(surface: TreatableSurface): boolean {
  return surface.type !== "floor";
}

function labelOf(type: TreatableSurface["type"], wallIndex: number): string {
  if (type === "floor") return "Piso";
  if (type === "ceiling") return "Techo";
  // Se numera por su arista y no por su id: los ids de la fixture CANON-01 se llaman wall_n/wall_s
  // y NO corresponden a los puntos cardinales, así que enseñarlos mentiría sobre dónde está el muro.
  return `Muro ${wallIndex}`;
}
