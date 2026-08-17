// src/features/room-editor/components/properties-panel.tsx — columna lateral fija, igual reparto
// que signal-flow/specs-panel.tsx: sin selección muestra el estado del recinto, con selección el
// panel de la figura elegida. Selección "colgante" (un vértice o figura que deshacer/rehacer borró
// de debajo) cae al panel vacío en vez de reventar — undo/redo no tocan `selection` a propósito.

"use client";

import { IdlePanel } from "@/features/room-editor/components/panels/idle-panel";
import { ObstaclePanel } from "@/features/room-editor/components/panels/obstacle-panel";
import { OpeningPanel } from "@/features/room-editor/components/panels/opening-panel";
import { SurfacePanel } from "@/features/room-editor/components/panels/surface-panel";
import { VertexPanel } from "@/features/room-editor/components/panels/vertex-panel";
import { ZonePanel } from "@/features/room-editor/components/panels/zone-panel";
import type { RoomSelection } from "@/features/room-editor/store/room-selection";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function PropertiesPanel() {
  const selection = useRoomStore((state) => state.selection);

  return (
    <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l bg-background p-4">
      <SelectedPanel selection={selection} />
    </aside>
  );
}

/** Se exporta sin el `aside` para que el editor 3D monte estos mismos paneles dentro del suyo, que
 *  además lleva la vuelta a la escena — ver room-3d-properties-panel.tsx. */
export function SelectedPanel({
  selection,
}: {
  selection: RoomSelection | null;
}) {
  if (!selection) return <IdlePanel />;

  switch (selection.kind) {
    case "vertex":
      return <VertexPanel index={selection.index} />;
    case "surface":
      return <SurfacePanel surfaceId={selection.id} />;
    case "obstacle":
      return <ObstaclePanel obstacleId={selection.id} />;
    case "opening":
      return <OpeningPanel openingId={selection.id} />;
    case "zone":
      return <ZonePanel zoneId={selection.id} />;
    default:
      return <IdlePanel />;
  }
}
