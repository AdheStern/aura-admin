// src/features/room-editor/components/panels/surface-panel.tsx — un muro elegido en el plano.
// Solo material y longitud (de lectura): la forma del muro se edita arrastrando sus vértices, no
// desde aquí — dos maneras de cambiar la misma geometría competirían por ser "la fuente de verdad".

"use client";

import { MaterialSelect } from "@/features/room-editor/components/material-select";
import {
  shellOf,
  wallLengthM,
} from "@/features/room-editor/model/wall-surfaces";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function SurfacePanel({ surfaceId }: { surfaceId: string }) {
  const document = useRoomStore((state) => state.document);
  const setSurfaceMaterial = useRoomStore((state) => state.setSurfaceMaterial);

  const surface = document.surfaces.find((s) => s.id === surfaceId);
  if (!surface) return null;

  const lengthM = wallLengthM(shellOf(document), surfaceId);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-sm font-medium">Muro</h2>
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        {lengthM !== null ? (
          <p className="text-sm text-muted-foreground">
            Longitud: {lengthM.toFixed(2)} m
          </p>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm">Material</span>
          <MaterialSelect
            value={surface.materialId}
            onChange={(materialId) =>
              setSurfaceMaterial(surface.id, materialId)
            }
          />
        </div>
      </div>
    </div>
  );
}
