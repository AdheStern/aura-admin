// src/features/room-editor/components/panels/opening-panel.tsx — una ventana o puerta.
// `y`/`height` no tienen dibujo en el plano cenital (ver opening-layer.tsx) así que este panel es
// la ÚNICA forma de tocarlas en el editor 2D — la Fase 4 les dará una vista donde sí se ven.

"use client";

import { Button } from "@/components/ui/button";
import { MaterialSelect } from "@/features/room-editor/components/material-select";
import { NumberField } from "@/features/room-editor/components/panels/number-field";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

const MIN_SIZE_M = 0.1;

export function OpeningPanel({ openingId }: { openingId: string }) {
  const opening = useRoomStore((state) =>
    state.document.openings.find((o) => o.id === openingId),
  );
  const canManage = useRoomStore((state) => state.canManage);
  const updateOpening = useRoomStore((state) => state.updateOpening);
  const removeOpening = useRoomStore((state) => state.removeOpening);

  if (!opening) return null;
  const [x, y, width, height] = opening.rect;

  function setRect(
    next: Partial<{ x: number; y: number; width: number; height: number }>,
  ) {
    if (!opening) return;
    updateOpening(opening.id, {
      rect: [
        next.x ?? x,
        next.y ?? y,
        next.width ?? width,
        next.height ?? height,
      ],
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-sm font-medium">
        {opening.type === "window" ? "Ventana" : "Puerta"}
      </h2>
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <NumberField
          id="opening-x"
          label="X sobre el muro (m)"
          value={x}
          onChange={(v) => setRect({ x: v })}
        />
        <NumberField
          id="opening-y"
          label="Altura del antepecho (m)"
          value={y}
          min={0}
          onChange={(v) => setRect({ y: v })}
        />
        <NumberField
          id="opening-width"
          label="Ancho (m)"
          value={width}
          min={MIN_SIZE_M}
          onChange={(v) => setRect({ width: v })}
        />
        <NumberField
          id="opening-height"
          label="Alto (m)"
          value={height}
          min={MIN_SIZE_M}
          onChange={(v) => setRect({ height: v })}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm">Material</span>
          <MaterialSelect
            value={opening.materialId}
            onChange={(materialId) => updateOpening(opening.id, { materialId })}
          />
        </div>
      </div>
      {canManage ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => removeOpening(opening.id)}
        >
          Quitar {opening.type === "window" ? "ventana" : "puerta"}
        </Button>
      ) : null}
    </div>
  );
}
