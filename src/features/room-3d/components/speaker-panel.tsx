// src/features/room-3d/components/speaker-panel.tsx — el panel numérico de §5.3: posición exacta,
// apuntado, nivel, polaridad y delay.
//
// Los campos de dos dueños distintos van en dos bloques separados a propósito: los de arriba se
// guardan en el recinto (comando + historial) y los de abajo parchean el nodo del grafo, que es lo
// que ve el editor de flujo. Se editan aquí porque es donde se afina un sistema, no porque sean
// datos del recinto.

"use client";

import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";
import { SpeakerAudioFields } from "@/features/room-3d/components/speaker-audio-fields";
import { SpeakerPlacementFields } from "@/features/room-3d/components/speaker-placement-fields";
import { isOmnidirectional } from "@/features/room-3d/model/coverage-cone";
import { useSpeakerStore } from "@/features/room-3d/store/speaker-store";

export function SpeakerPanel({ nodeId }: { nodeId: string }) {
  const speaker = useSpeakerStore((state) =>
    state.speakers.find((candidate) => candidate.nodeId === nodeId),
  );
  // Selección colgante: el parlante desapareció del grafo mientras el 3D estaba abierto.
  if (!speaker) return null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-sm font-medium">{speaker.label}</h2>
        <p className="text-xs text-muted-foreground">
          {speaker.spec
            ? `Cobertura ${speaker.spec.directivity.nominalCoverage.hDeg}° × ${speaker.spec.directivity.nominalCoverage.vDeg}°`
            : "Sin equipo elegido en el flujo de señal"}
        </p>
      </div>

      <SpeakerPlacementFields nodeId={nodeId} />
      <SpeakerAudioFields nodeId={nodeId} />

      {speaker.spec ? <CoverageNote spec={speaker.spec} /> : null}
    </div>
  );
}

/** Rotula el cono como lo que es. Mismo criterio que node-charts.tsx con los diagramas polares:
 *  el datasheet no publica la curva, así que lo que se dibuja es el modelo del Apéndice A.2. */
function CoverageNote({ spec }: { spec: SpeakerSpec }) {
  return (
    <p className="text-xs text-muted-foreground">
      {isOmnidirectional(spec)
        ? "Caja omnidireccional: radia en todas las direcciones, así que no hay cono que dibujar."
        : "El cono es el modelo paramétrico del ángulo nominal a −6 dB, no una medida de directividad."}
    </p>
  );
}
