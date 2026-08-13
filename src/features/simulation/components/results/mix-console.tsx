// src/features/simulation/components/results/mix-console.tsx — el balance, de un vistazo.
//
// Va lo primero de la sección, antes del detalle por instrumento, porque es lo que decide cómo
// suena la mezcla en la sala: un channel strip impecable no arregla que la voz vaya seis decibelios
// por debajo del teclado. Puestos en fila y contra la misma línea de 0 dB, el reparto se lee de una
// ojeada; en una lista de números habría que compararlos de memoria.
//
// Debajo van las razones. El porqué de cada nivel es la mitad de su valor y en un fader de dieciséis
// píxeles de ancho no cabe, pero perderlo dejaría una cifra sin defensa.

import { MixFader } from "@/features/simulation/components/results/mix-fader";
import { formatGain } from "@/features/simulation/model/mix-clipboard";
import { formatPan } from "@/features/simulation/model/mix-levels";
import type { InstrumentMix } from "@/features/simulation/schemas/mix-advice";

export function MixConsole({ instruments }: { instruments: InstrumentMix[] }) {
  if (instruments.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h4 className="text-sm font-semibold">Balance de la mezcla</h4>
        <p className="text-xs text-muted-foreground">
          Nivel de cada canal respecto al que lleva la mezcla, que va en 0 dB.
          Reparte el peso entre canales; no sube el sistema.
        </p>
      </div>

      {/* Scroll propio: con ocho canales la fila se sale del ancho, y la página entera no debe
          desplazarse en horizontal por culpa de esta sección. */}
      <div className="overflow-x-auto rounded-md border bg-muted/20 p-3">
        <div className="flex justify-center gap-2">
          {instruments.map((instrument) => (
            <MixFader
              key={instrument.instrumentId}
              name={instrument.instrumentName}
              level={instrument.level}
            />
          ))}
        </div>
      </div>

      <ul className="flex flex-col gap-1">
        {instruments.map((instrument) => (
          <li key={instrument.instrumentId} className="text-xs">
            <span className="font-medium">{instrument.instrumentName}</span>{" "}
            <span className="font-mono tabular-nums text-muted-foreground">
              {formatGain(instrument.level.gainDb)} ·{" "}
              {formatPan(instrument.level.panPercent)}
            </span>
            <span className="text-muted-foreground">
              {" "}
              — {instrument.level.description}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
