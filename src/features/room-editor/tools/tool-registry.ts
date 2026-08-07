// src/features/room-editor/tools/tool-registry.ts — registro único de herramientas (Factory +
// Registry, §9.1). La barra de herramientas, el cursor del lienzo y el despachador de eventos leen
// todos de esta tabla; dar de alta una herramienta nueva no toca ningún switch disperso.

import { measureTool } from "@/features/room-editor/tools/measure-tool";
import { createOpeningTool } from "@/features/room-editor/tools/opening-tool";
import { createPillarTool } from "@/features/room-editor/tools/pillar-tool";
import { polylineTool } from "@/features/room-editor/tools/polyline-tool";
import { rectTool } from "@/features/room-editor/tools/rect-tool";
import type {
  RoomToolHandlers,
  RoomToolKind,
} from "@/features/room-editor/tools/tool-types";
import { createZoneTool } from "@/features/room-editor/tools/zone-tool";

// Ni "select" ni "erase" despachan a ningún handler (ver la nota de tool-types.ts): entran en el
// registro solo para que la tira de herramientas y el cursor los traten como una opción más. Quien
// hace el trabajo con ellos activos son las capas, que ya tienen el hit-testing por figura.
const SELECT_TOOL: RoomToolHandlers = {
  label: "Seleccionar / mover",
  cursor: "default",
  onPointerDown: () => ({}),
};

const ERASE_TOOL: RoomToolHandlers = {
  label: "Borrar",
  cursor: "pointer",
  onPointerDown: () => ({}),
};

export const ROOM_TOOLS: Record<RoomToolKind, RoomToolHandlers> = {
  select: SELECT_TOOL,
  erase: ERASE_TOOL,
  wall: polylineTool,
  rect: rectTool,
  pillarRect: createPillarTool("rect"),
  pillarCircle: createPillarTool("circle"),
  window: createOpeningTool("window"),
  door: createOpeningTool("door"),
  stageZone: createZoneTool("stage"),
  audienceZone: createZoneTool("audience"),
  measure: measureTool,
};

export type RoomToolGroup = {
  id: string;
  /** Encabezado del flyout; las ranuras de una sola herramienta no lo muestran. */
  label: string;
  tools: RoomToolKind[];
  /** Filete separador debajo de la ranura: aparta las utilidades (seleccionar, medir) de las
   *  herramientas que sí modifican la geometría. */
  dividerAfter?: boolean;
};

/**
 * Cómo se reparten las herramientas en las ranuras de la tira lateral (tool-sidebar.tsx): las
 * variantes de una misma familia comparten ranura y se eligen desde un flyout, igual que la barra
 * de Photoshop. Así la tira se queda en una columna estrecha aunque el registro siga creciendo.
 *
 * Orden y agrupamiento siguen la lista mínima de §5.2 del doc maestro. Toda herramienta de
 * ROOM_TOOLS tiene que aparecer aquí exactamente una vez — si no, desaparece de la UI sin que nada
 * falle; tool-registry.test.ts lo vigila.
 */
export const TOOL_GROUPS: RoomToolGroup[] = [
  { id: "select", label: "Seleccionar", tools: ["select"], dividerAfter: true },
  { id: "footprint", label: "Planta", tools: ["wall", "rect"] },
  { id: "pillar", label: "Pilar", tools: ["pillarRect", "pillarCircle"] },
  { id: "opening", label: "Abertura", tools: ["window", "door"] },
  {
    id: "zone",
    label: "Zona",
    tools: ["stageZone", "audienceZone"],
    dividerAfter: true,
  },
  { id: "measure", label: "Medición", tools: ["measure"] },
  { id: "erase", label: "Borrar", tools: ["erase"] },
];
