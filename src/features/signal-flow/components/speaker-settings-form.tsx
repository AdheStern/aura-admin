// src/features/signal-flow/components/speaker-settings-form.tsx — los tres ajustes de escena del
// parlante (levelDb, polarityInverted, delayMs). Viven en el panel y no en el cuerpo del nodo por
// la decisión tomada con el usuario: el nodo se queda angosto, estos tres solo importan al elegir
// esa caja en particular. Van tal cual al SimulationRequest cuando la Tarea 3 compile el payload.

"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SpeakerNodeData } from "@/features/signal-flow/schemas/node-data";
import { useFlowStore } from "@/features/signal-flow/store/flow-store-provider";

export function SpeakerSettingsForm({
  nodeId,
  data,
}: {
  nodeId: string;
  data: SpeakerNodeData;
}) {
  const updateSpeakerSettings = useFlowStore(
    (state) => state.updateSpeakerSettings,
  );
  const canManage = useFlowStore((state) => state.canManage);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase">
        Ajustes de escena
      </h3>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="speaker-level">Nivel (dB)</Label>
        <Input
          id="speaker-level"
          type="number"
          step={0.5}
          value={data.levelDb}
          disabled={!canManage}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (Number.isFinite(value)) {
              updateSpeakerSettings(nodeId, { levelDb: value });
            }
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="speaker-polarity"
          checked={data.polarityInverted}
          disabled={!canManage}
          onCheckedChange={(checked) =>
            updateSpeakerSettings(nodeId, { polarityInverted: checked })
          }
        />
        <Label htmlFor="speaker-polarity">Polaridad invertida</Label>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="speaker-delay">Delay (ms)</Label>
        <Input
          id="speaker-delay"
          type="number"
          min={0}
          step={1}
          value={data.delayMs}
          disabled={!canManage}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (Number.isFinite(value)) {
              updateSpeakerSettings(nodeId, { delayMs: value });
            }
          }}
        />
      </div>
    </div>
  );
}
