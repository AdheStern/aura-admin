// src/features/room-3d/components/speaker-placement-fields.tsx — posición y apuntado, la mitad del
// panel que se guarda en el recinto. Escribe el mismo comando que el gizmo, así que teclear una
// cota y arrastrar el gizmo son la misma operación y comparten historial.

"use client";

import { Button } from "@/components/ui/button";
import { useSpeakerStore } from "@/features/room-3d/store/speaker-store";
import { NumberField } from "@/features/room-editor/components/panels/number-field";
import { resolveSpeakerPlacements } from "@/features/room-editor/model/speaker-placement";
import type { RoomSpeaker } from "@/features/room-editor/schemas/room-document";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function SpeakerPlacementFields({ nodeId }: { nodeId: string }) {
  const document = useRoomStore((state) => state.document);
  const canManage = useRoomStore((state) => state.canManage);
  const runCommand = useRoomStore((state) => state.runCommand);
  const gizmoMode = useSpeakerStore((state) => state.gizmoMode);
  const setGizmoMode = useSpeakerStore((state) => state.setGizmoMode);

  const [placement] = resolveSpeakerPlacements(document, [nodeId]);
  const [x, y, z] = placement.position;

  function place(next: Partial<Omit<RoomSpeaker, "nodeId">>) {
    // `placement` puede ser el resuelto por defecto (todavía sin guardar): escribirlo entero es lo
    // que convierte esa posición implícita en una elegida, que es justo lo que hace el usuario aquí.
    runCommand({
      kind: "setSpeakerPlacement",
      speaker: { ...placement, ...next, nodeId },
    });
  }

  const axis = (index: 0 | 1 | 2, value: number) =>
    place({
      position: placement.position.map((current, at) =>
        at === index ? value : current,
      ) as RoomSpeaker["position"],
    });

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase">
        Colocación
      </h3>
      {canManage ? (
        <div className="flex gap-1">
          {(["translate", "rotate"] as const).map((mode) => (
            <Button
              key={mode}
              variant={gizmoMode === mode ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setGizmoMode(mode)}
            >
              {mode === "translate" ? "Mover" : "Girar"}
            </Button>
          ))}
        </div>
      ) : null}

      <NumberField
        id="speaker-x"
        label="X (m)"
        value={x}
        onChange={(value) => axis(0, value)}
      />
      <NumberField
        id="speaker-y"
        label="Y (m)"
        value={y}
        onChange={(value) => axis(1, value)}
      />
      <NumberField
        id="speaker-z"
        label="Altura (m)"
        value={z}
        onChange={(value) => axis(2, value)}
      />
      <NumberField
        id="speaker-yaw"
        label="Giro (°)"
        value={placement.rotationDeg.yaw}
        step={1}
        onChange={(yaw) =>
          place({ rotationDeg: { ...placement.rotationDeg, yaw } })
        }
      />
      <NumberField
        id="speaker-pitch"
        label="Inclinación (°)"
        value={placement.rotationDeg.pitch}
        step={1}
        onChange={(pitch) =>
          place({ rotationDeg: { ...placement.rotationDeg, pitch } })
        }
      />
      <NumberField
        id="speaker-roll"
        label="Alabeo (°)"
        value={placement.rotationDeg.roll}
        step={1}
        onChange={(roll) =>
          place({ rotationDeg: { ...placement.rotationDeg, roll } })
        }
      />
    </div>
  );
}
