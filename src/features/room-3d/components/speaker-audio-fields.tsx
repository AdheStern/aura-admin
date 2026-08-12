// src/features/room-3d/components/speaker-audio-fields.tsx — nivel, polaridad y delay: la mitad
// del panel cuyo dueño es el NODO del grafo, no el recinto. No pasa por el historial del CAD
// porque no es geometría — deshacer un movimiento del gizmo no debe revertir un trim de nivel.
//
// Mismos controles que el panel del flujo (SpeakerLevelSlider): son los mismos tres campos y el
// mismo schema, así que tenerlos con dos aspectos y dos rangos distintos solo podía acabar en que
// uno de los dos dejara pasar lo que el otro rechaza.

"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSpeakerStore } from "@/features/room-3d/store/speaker-store";
import { NumberField } from "@/features/room-editor/components/panels/number-field";
import { SpeakerLevelSlider } from "@/features/signal-flow/components/speaker-level-slider";
import { DELAY_MS_RANGE } from "@/features/signal-flow/schemas/node-data";

export function SpeakerAudioFields({ nodeId }: { nodeId: string }) {
  const audio = useSpeakerStore((state) => state.audioByNodeId[nodeId]);
  const canManage = useSpeakerStore((state) => state.canManage);
  const setSpeakerAudio = useSpeakerStore((state) => state.setSpeakerAudio);
  if (!audio) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase">
        Ajustes de la caja
      </h3>
      <SpeakerLevelSlider
        value={audio.levelDb}
        disabled={!canManage}
        onChange={(levelDb) => setSpeakerAudio(nodeId, { levelDb })}
      />
      <NumberField
        id="speaker-delay"
        label="Delay (ms)"
        value={audio.delayMs}
        min={DELAY_MS_RANGE.min}
        max={DELAY_MS_RANGE.max}
        step={DELAY_MS_RANGE.step}
        onChange={(delayMs) => setSpeakerAudio(nodeId, { delayMs })}
      />
      <div className="flex items-center gap-2">
        <Checkbox
          id="speaker-polarity"
          checked={audio.polarityInverted}
          disabled={!canManage}
          onCheckedChange={(checked) =>
            setSpeakerAudio(nodeId, { polarityInverted: checked === true })
          }
        />
        <Label htmlFor="speaker-polarity">Polaridad invertida</Label>
      </div>
    </div>
  );
}
