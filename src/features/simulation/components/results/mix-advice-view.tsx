// src/features/simulation/components/results/mix-advice-view.tsx — el consejo, ya generado.
//
// Encabeza con la procedencia —proveedor, modelo y fecha— y no al pie: quien mire esto tiene que
// saber de dónde salen las cifras ANTES de leerlas, no después de habérselas creído.
//
// La EQ de sala va primero porque es la que condiciona a todas las demás: ecualizar un canal contra
// una sala sin corregir es trabajar dos veces.

import { ChannelStrip } from "@/features/simulation/components/results/channel-strip";
import { EqCurveChart } from "@/features/simulation/components/results/eq-curve-chart";
import { MixEqBands } from "@/features/simulation/components/results/mix-eq-bands";
import type { StoredMixAdvice } from "@/features/simulation/queries/get-mix-advice";

export function MixAdviceView({ stored }: { stored: StoredMixAdvice }) {
  const { advice, provider, model, generatedAt } = stored;
  const origin = { provider, model };
  const roomBands = advice.roomEq.bands.map((band) => ({
    frequencyHz: band.frequencyHz,
    gainDb: band.gainDb,
    q: band.q,
    filterType: band.filterType,
  }));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Propuesto por {provider} · {model} · {formatDate(generatedAt)}
      </p>

      <p className="text-sm">{advice.summary}</p>

      {roomBands.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold">Ecualización de sala</h4>
          <EqCurveChart bands={roomBands} />
          <MixEqBands bands={advice.roomEq.bands} />
          <p className="text-xs text-muted-foreground">
            {advice.roomEq.description}
          </p>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold">
          Por instrumento ({advice.instruments.length})
        </h4>
        {advice.instruments.map((instrument) => (
          <ChannelStrip
            key={instrument.instrumentId}
            instrument={instrument}
            origin={origin}
          />
        ))}
      </section>
    </div>
  );
}

/** Fecha ilegible no rompe la sección: el consejo sigue valiendo aunque su marca esté corrupta. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "fecha desconocida"
    : date.toLocaleString("es", { dateStyle: "long", timeStyle: "short" });
}
