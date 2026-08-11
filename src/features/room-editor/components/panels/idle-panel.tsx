// src/features/room-editor/components/panels/idle-panel.tsx — nada seleccionado: las tres cotas
// que son propiedad de la SALA entera (altura, material de piso, material de techo) y no de una
// figura que se pueda clicar en el plano cenital, más el veredicto del validador.

"use client";

import { MaterialSelect } from "@/features/room-editor/components/material-select";
import { NumberField } from "@/features/room-editor/components/panels/number-field";
import { RoomValidationSummary } from "@/features/room-editor/components/room-validation-summary";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function IdlePanel() {
  const document = useRoomStore((state) => state.document);
  const setHeightM = useRoomStore((state) => state.setHeightM);
  const setSurfaceMaterial = useRoomStore((state) => state.setSurfaceMaterial);

  const floor = document.surfaces.find((surface) => surface.type === "floor");
  const ceiling = document.surfaces.find(
    (surface) => surface.type === "ceiling",
  );

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-sm font-medium">Recinto</h2>

      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase">
          Dimensiones
        </h3>
        <NumberField
          id="room-height"
          label="Altura (m)"
          value={document.height.h}
          step={0.1}
          min={0.1}
          onChange={setHeightM}
        />
        {floor ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm">Material de piso</span>
            <MaterialSelect
              value={floor.materialId}
              onChange={(materialId) =>
                setSurfaceMaterial(floor.id, materialId)
              }
            />
          </div>
        ) : null}
        {ceiling ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm">Material de techo</span>
            <MaterialSelect
              value={ceiling.materialId}
              onChange={(materialId) =>
                setSurfaceMaterial(ceiling.id, materialId)
              }
            />
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
          Estado
        </h3>
        <RoomValidationSummary />
      </div>
    </div>
  );
}
