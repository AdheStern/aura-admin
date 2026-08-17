// src/features/simulation/components/results/channel-strip.tsx — un instrumento, como un plugin.
//
// Reutiliza EqCurveChart, la misma gráfica que dibuja la EQ del motor. No es ahorro de código: la
// curva de un paramétrico es la curva de un paramétrico, y dibujar la de la IA con otra forma
// insinuaría que una de las dos no es real. Lo que las distingue es la SECCIÓN donde viven, no el
// dibujo — de ahí que aquí no haya evidencia: no la hay, estas cifras no salen de una medida.
//
// La gráfica recibe el filterType de cada banda: el asesor propone shelves y cortes, y un
// pasa-altos pintado como campana sería un dibujo que el equipo del operador no puede reproducir.

"use client";

import { Copy, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EqCurveChart } from "@/features/simulation/components/results/eq-curve-chart";
import { MixDynamics } from "@/features/simulation/components/results/mix-dynamics";
import { MixEqBands } from "@/features/simulation/components/results/mix-eq-bands";
import {
  formatChannelStrip,
  formatGain,
} from "@/features/simulation/model/mix-clipboard";
import { formatPan } from "@/features/simulation/model/mix-levels";
import type { InstrumentMix } from "@/features/simulation/schemas/mix-advice";

export function ChannelStrip({
  instrument,
  origin,
}: {
  instrument: InstrumentMix;
  origin: { provider: string; model: string };
}) {
  const bands = instrument.eq.bands.map((band) => ({
    frequencyHz: band.frequencyHz,
    gainDb: band.gainDb,
    q: band.q,
    filterType: band.filterType,
  }));

  return (
    <article className="rounded-md border">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 p-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal
            className="size-4 text-muted-foreground"
            aria-hidden
          />
          <div>
            <h4 className="text-sm font-semibold">
              {instrument.instrumentName}
            </h4>
            {/* El nivel se repite aquí aunque esté en la mesa de arriba: quien copia este canal
                necesita verlo con el resto de sus ajustes, no a dos secciones de distancia. */}
            <p className="font-mono text-xs text-muted-foreground tabular-nums">
              {formatGain(instrument.level.gainDb)} ·{" "}
              {formatPan(instrument.level.panPercent)}
            </p>
          </div>
        </div>
        <CopyButton text={formatChannelStrip(instrument, origin)} />
      </header>

      <div className="flex flex-col gap-3 p-3">
        <EqCurveChart bands={bands} />
        <MixEqBands bands={instrument.eq.bands} />
        <p className="text-xs text-muted-foreground">
          {instrument.eq.description}
        </p>
        <MixDynamics
          reverb={instrument.reverb}
          compression={instrument.compression}
        />
      </div>
    </article>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      <Copy className="mr-1 size-3.5" aria-hidden />
      {copied ? "Copiado" : "Copiar ajustes"}
    </Button>
  );
}
