// src/features/room-editor/hooks/use-shape-mode.ts — qué puede hacer un clic sobre una figura ya
// dibujada, según la herramienta activa. Lo comparten las cuatro capas (footprint, obstacle,
// opening, zone) porque la condición es la misma en todas y tenerla escrita cuatro veces es cómo
// una capa se queda sorda al añadir un modo nuevo: fue exactamente el bug de la Tarea 2, cuando las
// capas devolvían null fuera de "seleccionar" y las figuras desaparecían.

"use client";

import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export type ShapeMode = {
  canSelect: boolean;
  canErase: boolean;
  /** `listening` de Konva: fuera de estos dos modos la figura deja pasar el clic al Stage, que es
   *  lo que necesitan las herramientas de inserción para poder dibujar encima de lo ya dibujado. */
  isInteractive: boolean;
  canDrag: boolean;
};

export function useShapeMode(): ShapeMode {
  const activeTool = useRoomStore((state) => state.activeTool);
  const canManage = useRoomStore((state) => state.canManage);

  const canSelect = activeTool === "select";
  // Sin permiso de edición la goma no borra nada, así que tampoco escucha: si escuchara, se comería
  // los clics de selección de quien solo puede mirar.
  const canErase = activeTool === "erase" && canManage;

  return {
    canSelect,
    canErase,
    isInteractive: canSelect || canErase,
    canDrag: canSelect && canManage,
  };
}
