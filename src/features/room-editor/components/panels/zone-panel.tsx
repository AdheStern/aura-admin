// src/features/room-editor/components/panels/zone-panel.tsx — escenario o zona de audiencia. La
// misma etiqueta ("cota vertical") vale para las dos: `elevation` en el escenario y `earHeight` en
// audiencia son la misma clase de dato con nombre distinto por catálogo (ver room-selection.ts).

"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { NumberField } from "@/features/room-editor/components/panels/number-field";
import { findZone } from "@/features/room-editor/store/room-selection";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function ZonePanel({ zoneId }: { zoneId: string }) {
  const document = useRoomStore((state) => state.document);
  const canManage = useRoomStore((state) => state.canManage);
  const updateZoneAttributes = useRoomStore(
    (state) => state.updateZoneAttributes,
  );
  const removeZone = useRoomStore((state) => state.removeZone);

  const resolved = findZone(document, zoneId);
  if (!resolved) return null;

  const isStage = resolved.origin === "stage";
  const cotaM = isStage ? resolved.zone.elevation : resolved.zone.earHeight;
  const seated = resolved.origin === "audience" ? resolved.zone.seated : null;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-sm font-medium">
        {isStage ? "Escenario" : "Zona de audiencia"}
      </h2>
      <div className="flex flex-col gap-3 rounded-lg border p-3">
        <NumberField
          id="zone-cota"
          label={isStage ? "Elevación (m)" : "Altura de oído (m)"}
          value={cotaM}
          min={0}
          onChange={(value) =>
            updateZoneAttributes(zoneId, { earHeightOrElevation: value })
          }
        />
        {seated !== null ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id="zone-seated"
              checked={seated}
              disabled={!canManage}
              onCheckedChange={(checked) =>
                updateZoneAttributes(zoneId, {
                  earHeightOrElevation: cotaM,
                  seated: checked,
                })
              }
            />
            <Label htmlFor="zone-seated">Público sentado</Label>
          </div>
        ) : null}
      </div>
      {canManage ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={() => removeZone(zoneId)}
        >
          Quitar {isStage ? "escenario" : "zona"}
        </Button>
      ) : null}
    </div>
  );
}
