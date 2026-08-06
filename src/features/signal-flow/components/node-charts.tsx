// src/features/signal-flow/components/node-charts.tsx — la parte didáctica del panel: qué hace
// este aparato con el sonido, dibujado en vez de tabulado.
//
// El micrófono muestra su patrón polar y su respuesta; el parlante, su cobertura en los dos planos
// y su respuesta. Ninguno de los dos diagramas polares es una medición: MicrophoneSpec publica el
// NOMBRE del patrón y SpeakerSpec la cobertura en grados, así que las curvas salen de los modelos
// de directivity.ts. El pie de cada gráfico lo dice — un diagrama que parece medido y no lo es
// engaña más que no ponerlo.

"use client";

import type { MicrophoneSpec } from "@/contracts/microphone-spec.schema";
import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";
import { FrequencyResponseChart } from "@/features/catalogs/components/frequency-response-chart";
import { PolarPatternChart } from "@/features/catalogs/components/polar-pattern-chart";
import {
  microphonePolarPattern,
  speakerCoveragePattern,
} from "@/features/catalogs/directivity";
import {
  categoryLabel,
  MICROPHONE_PATTERN_LABEL,
} from "@/features/catalogs/schemas/kind-labels";

export function MicrophoneCharts({ spec }: { spec: MicrophoneSpec }) {
  return (
    <div className="flex flex-col gap-4">
      <ChartBlock
        title={`Patrón polar · ${categoryLabel(spec.polarPattern, MICROPHONE_PATTERN_LABEL)}`}
        note="Modelo de primer orden a partir del patrón declarado, no una medición. 0° es el eje del micrófono."
      >
        <PolarPatternChart
          samples={microphonePolarPattern(spec.polarPattern)}
        />
      </ChartBlock>

      <ChartBlock title="Respuesta en frecuencia">
        <FrequencyResponseChart curve={spec.frequencyResponse.curve} />
      </ChartBlock>
    </div>
  );
}

export function SpeakerCharts({ spec }: { spec: SpeakerSpec }) {
  const { hDeg, vDeg } = spec.directivity.nominalCoverage;

  return (
    <div className="flex flex-col gap-4">
      <ChartBlock
        title={`Cobertura horizontal · ${hDeg}°`}
        note="Modelo paramétrico del Apéndice A.2 en agudos: la cobertura nominal es el ángulo total a −6 dB."
      >
        <PolarPatternChart samples={speakerCoveragePattern(hDeg)} />
      </ChartBlock>

      <ChartBlock title={`Cobertura vertical · ${vDeg}°`}>
        <PolarPatternChart samples={speakerCoveragePattern(vDeg)} />
      </ChartBlock>

      <ChartBlock title="Respuesta en frecuencia">
        <FrequencyResponseChart curve={spec.frequencyResponse.curve} />
      </ChartBlock>
    </div>
  );
}

function ChartBlock({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="flex flex-col gap-1.5">
      <figcaption className="text-xs font-semibold text-muted-foreground uppercase">
        {title}
      </figcaption>
      <div className="flex justify-center">{children}</div>
      {note ? (
        <p className="text-[11px] leading-snug text-muted-foreground">{note}</p>
      ) : null}
    </figure>
  );
}
