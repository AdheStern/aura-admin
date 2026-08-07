// src/features/room-editor/components/panels/vertex-panel.tsx — un vértice del footprint.
// Borrar está deshabilitado por debajo de 3: el contrato exige un mínimo de vértices y dejar
// intentarlo solo para que el validador lo rechace después es peor UX que no dejarlo intentar.

"use client";

import { Button } from "@/components/ui/button";
import { NumberField } from "@/features/room-editor/components/panels/number-field";
import { MIN_FOOTPRINT_VERTICES } from "@/features/room-editor/model/polygon-2d";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function VertexPanel({ index }: { index: number }) {
  const vertex = useRoomStore(
    (state) => state.document.footprint.vertices[index],
  );
  const vertexCount = useRoomStore(
    (state) => state.document.footprint.vertices.length,
  );
  const canManage = useRoomStore((state) => state.canManage);
  const moveVertexTo = useRoomStore((state) => state.moveVertexTo);
  const removeVertexAt = useRoomStore((state) => state.removeVertexAt);

  if (!vertex) return null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-sm font-medium">Vértice {index + 1}</h2>
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <NumberField
          id="vertex-x"
          label="X (m)"
          value={vertex[0]}
          onChange={(x) => moveVertexTo(index, [x, vertex[1]])}
        />
        <NumberField
          id="vertex-y"
          label="Y (m)"
          value={vertex[1]}
          onChange={(y) => moveVertexTo(index, [vertex[0], y])}
        />
      </div>
      {canManage ? (
        <Button
          variant="destructive"
          size="sm"
          disabled={vertexCount <= MIN_FOOTPRINT_VERTICES}
          onClick={() => removeVertexAt(index)}
        >
          Quitar vértice
        </Button>
      ) : null}
    </div>
  );
}
