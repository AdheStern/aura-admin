// src/features/room-3d/components/speaker-rig.tsx — instancia una caja por nodo `speaker` del
// grafo (§5.3: la fuente de verdad es el flujo, aquí no se crean parlantes).
//
// Itera sobre los parlantes del GRAFO y les busca la colocación, nunca al revés: así una colocación
// cuyo nodo se borró queda inerte en vez de pintar una caja fantasma, y un parlante recién añadido
// aparece en su posición por defecto sin que nadie tenga que sembrarla.

"use client";

import { SpeakerGizmo } from "@/features/room-3d/components/speaker-gizmo";
import {
  coverageReachM,
  coverageShape,
} from "@/features/room-3d/model/coverage-shape";
import { toScenePoint } from "@/features/room-3d/model/scene-frame";
import { toSceneRotation } from "@/features/room-3d/model/speaker-orientation";
import { useSpeakerStore } from "@/features/room-3d/store/speaker-store";
import { resolveSpeakerPlacements } from "@/features/room-editor/model/speaker-placement";
import type { RoomSpeaker } from "@/features/room-editor/schemas/room-document";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

/** Mismo azul de selección que el resto del editor (canvas-palette.ts). */
const SELECTED_HEX = "#0ea5e9";
/** #27272a (zinc-800): más oscuro que el extremo absorbente de la rampa de los muros
 *  (ver nrc-color.ts), o una caja sobre una pared tratada se camuflaría con ella. */
const SPEAKER_HEX = "#27272a";

const MM_PER_M = 1000;

export function SpeakerRig() {
  const document = useRoomStore((state) => state.document);
  const selection = useRoomStore((state) => state.selection);
  const select = useRoomStore((state) => state.select);
  const runCommand = useRoomStore((state) => state.runCommand);
  const canManage = useRoomStore((state) => state.canManage);

  const speakers = useSpeakerStore((state) => state.speakers);
  const gizmoMode = useSpeakerStore((state) => state.gizmoMode);

  const placements = resolveSpeakerPlacements(
    document,
    speakers.map((speaker) => speaker.nodeId),
  );

  return (
    <>
      {speakers.map((speaker, index) => {
        const placement = placements[index];
        const isSelected =
          selection?.kind === "speaker" && selection.id === speaker.nodeId;
        const reachM = coverageReachM(
          [placement.position[0], placement.position[1]],
          document.footprint.vertices,
        );

        return (
          <SpeakerGizmo
            key={speaker.nodeId}
            nodeId={speaker.nodeId}
            position={toScenePoint(placement.position)}
            rotation={toSceneRotation(placement.rotationDeg)}
            boxM={boxSizeM(speaker.spec)}
            coverage={coverageShape(speaker.spec, reachM)}
            color={isSelected ? SELECTED_HEX : SPEAKER_HEX}
            isSelected={isSelected}
            canManage={canManage}
            mode={gizmoMode}
            onSelect={() => select({ kind: "speaker", id: speaker.nodeId })}
            onPlace={(next: Omit<RoomSpeaker, "nodeId">) =>
              runCommand({
                kind: "setSpeakerPlacement",
                speaker: { nodeId: speaker.nodeId, ...next },
              })
            }
          />
        );
      })}
    </>
  );
}

/** El datasheet da [ancho, alto, profundidad]; el eje de tiro local es +x, o sea la profundidad. */
function boxSizeM(
  spec: { physical?: { dimensionsMm?: number[] } } | null,
): [number, number, number] | null {
  const dimensions = spec?.physical?.dimensionsMm;
  if (!dimensions || dimensions.length < 3) return null;

  const [widthMm, heightMm, depthMm] = dimensions;
  return [depthMm / MM_PER_M, heightMm / MM_PER_M, widthMm / MM_PER_M];
}
