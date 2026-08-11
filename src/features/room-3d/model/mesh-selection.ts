// src/features/room-3d/model/mesh-selection.ts — codifica una RoomSelection en el `name` de una
// malla three.js. El canvas 3D tiene un único handler de click (room-3d-canvas.tsx) que decodifica
// lo que reporta el raycaster de R3F; separarlo de los componentes es lo que permite testear "qué
// selección produce un click" con Vitest puro, sin WebGL de por medio.

import type { RoomSelection } from "@/features/room-editor/store/room-selection";

const SEPARATOR = ":";

export function encodeMeshName(selection: RoomSelection): string {
  const id =
    selection.kind === "vertex" ? String(selection.index) : selection.id;
  return `${selection.kind}${SEPARATOR}${id}`;
}

export function decodeMeshName(name: string): RoomSelection | null {
  const separatorAt = name.indexOf(SEPARATOR);
  if (separatorAt === -1) return null;

  const kind = name.slice(0, separatorAt);
  const rest = name.slice(separatorAt + 1);

  switch (kind) {
    case "surface":
    case "obstacle":
    case "opening":
    case "zone":
      return rest.length > 0 ? { kind, id: rest } : null;
    case "vertex": {
      const index = Number(rest);
      return Number.isInteger(index) ? { kind: "vertex", index } : null;
    }
    default:
      return null;
  }
}
