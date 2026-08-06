// src/features/signal-flow/components/speaker-electrical-summary.tsx — lo que la caja seleccionada
// va a mandarle al motor: los vatios que recibe y el programa que reproduce (tarea 3).
//
// Muestra también DE DÓNDE sale la cifra —qué canal, cuántas cajas comparten la carga, a qué
// impedancia— porque "262.5 W" sin contexto es imposible de verificar de un vistazo, y esta es la
// pantalla donde el usuario comprueba que el sistema que dibujó es el que tenía en la cabeza.

"use client";

import { SpecDatasheet } from "@/features/catalogs/components/spec-datasheet";
import { useGraphIndex } from "@/features/signal-flow/hooks/use-graph-index";
import { nodeOf } from "@/features/signal-flow/model/graph-index";
import {
  PROGRAM_SPECTRUM_LABEL,
  resolveProgramSpectrum,
} from "@/features/signal-flow/resolution/program-spectrum";
import {
  type PowerOrigin,
  resolveSpeakerPower,
} from "@/features/signal-flow/resolution/speaker-power";
import { portChannelIndex } from "@/features/signal-flow/schemas/port-ids";

export function SpeakerElectricalSummary({ nodeId }: { nodeId: string }) {
  const index = useGraphIndex();
  const power = resolveSpeakerPower(index, nodeId);
  const spectrum = resolveProgramSpectrum(index, nodeId);

  const rows: [string, string][] = [
    [
      "Potencia recibida",
      power.ok ? `${formatWatts(power.watts)} W` : "Sin resolver",
    ],
    ["Origen", power.ok ? originLabel(index, power.origin) : "—"],
    [
      "Programa",
      spectrum ? PROGRAM_SPECTRUM_LABEL[spectrum] : "Ninguna fuente lo alcanza",
    ],
  ];

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase">
        Resolución eléctrica
      </h3>
      <SpecDatasheet rows={rows} />
      {power.ok ? null : (
        <p className="text-xs text-destructive">
          Se resolverá cuando el grafo deje de tener errores en esta caja.
        </p>
      )}
    </div>
  );
}

function originLabel(
  index: ReturnType<typeof useGraphIndex>,
  origin: PowerOrigin,
): string {
  if (origin.kind === "active_stage") {
    return "Etapa propia de la caja (activa)";
  }

  const amp = nodeOf(index, origin.ampNodeId);
  const model =
    amp?.kind === "pa" && amp.spec
      ? ampModelLabel(amp.spec.kind)
      : "amplificador";
  const channel = (portChannelIndex(origin.ampPortId) ?? 0) + 1;
  const shared =
    origin.speakerCount > 1
      ? ` · ${origin.speakerCount} cajas en paralelo (${origin.loadImpedanceOhm} Ω, ${formatWatts(origin.channelWatts)} W al canal)`
      : ` · ${origin.loadImpedanceOhm} Ω`;

  return `Canal ${channel} del ${model}${shared}`;
}

function ampModelLabel(kind: string): string {
  return kind === "processor" ? "procesador" : "amplificador";
}

// Una décima basta: el motor hace 10·log₁₀(P) y 0.1 W sobre 300 son 0.0014 dB. El redondeo vive
// aquí y no en la resolución, que devuelve la cifra exacta para que las partes sumen el total.
function formatWatts(watts: number): string {
  return (Math.round(watts * 10) / 10).toString();
}
