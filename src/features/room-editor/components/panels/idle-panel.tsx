// src/features/room-editor/components/panels/idle-panel.tsx — nada seleccionado: las cotas que son
// propiedad de la SALA entera (altura y materiales) y no de una figura concreta, más el veredicto
// del validador.
//
// Piso y techo están aquí porque no hay dónde clicarlos en un plano cenital. Los muros SÍ se pueden
// clicar uno a uno, y aun así tienen su campo: el caso normal es que todo el perímetro sea la misma
// pared, y obligar a recorrer los cuatro (o los veinte) lados para decir lo mismo cuatro veces es
// trabajo sin criterio. Elegir uno concreto en el plano sigue mandando sobre esto.

"use client";

import { MaterialSelect } from "@/features/room-editor/components/material-select";
import { NumberField } from "@/features/room-editor/components/panels/number-field";
import { RoomValidationSummary } from "@/features/room-editor/components/room-validation-summary";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function IdlePanel() {
  const document = useRoomStore((state) => state.document);
  const setHeightM = useRoomStore((state) => state.setHeightM);
  const setSurfaceMaterial = useRoomStore((state) => state.setSurfaceMaterial);
  const setWallsMaterial = useRoomStore((state) => state.setWallsMaterial);

  const floor = document.surfaces.find((surface) => surface.type === "floor");
  const ceiling = document.surfaces.find(
    (surface) => surface.type === "ceiling",
  );
  const walls = document.surfaces.filter((surface) => surface.type === "wall");

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
        {walls.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm">Material de muros</span>
            <MaterialSelect
              value={sharedMaterialId(walls)}
              onChange={setWallsMaterial}
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

/** El material común de los muros, o `null` si no coinciden — el mismo hueco que "sin asignar", que
 *  es lo correcto: elegir uno los iguala a todos, que es justo lo que este campo hace. */
function sharedMaterialId(
  walls: { materialId: string | null }[],
): string | null {
  const first = walls[0]?.materialId ?? null;
  return walls.every((wall) => wall.materialId === first) ? first : null;
}
