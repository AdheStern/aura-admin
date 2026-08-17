// src/features/simulation/components/results/eq-curve-chart.tsx — la corrección, como la vería un
// operador en su paramétrico.
//
// Eje X logarítmico y marcas en las octavas: es como se lee la frecuencia en cualquier equipo, y en
// lineal los graves se aplastan contra el margen izquierdo hasta desaparecer.
//
// Dos series y no una: la CURVA es lo que hay que teclear en el equipo, y los PUNTOS son el desvío
// medido que la motiva. Sin el desvío al lado, la campana es una afirmación sin apoyo; juntas se ve
// que una es el espejo de la otra. Por eso el desvío se pinta tal cual sale del motor, con su signo:
// donde falta energía (−5.2 dB) el filtro sube (+5.2 dB).

"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { type EqBand, eqCurve } from "@/features/simulation/model/eq-curve";

const OCTAVE_TICKS = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16_000];

const CONFIG: ChartConfig = {
  gainDb: { label: "Corrección (dB)", color: "var(--chart-1)" },
  deviationDb: { label: "Desvío medido (dB)", color: "var(--chart-2)" },
};

export function EqCurveChart({
  bands,
  deviationByBand,
}: {
  bands: EqBand[];
  /** Hz → dB medidos. Ausente en las EQ que no nacen de una medida por banda. */
  deviationByBand?: Record<string, number> | null;
}) {
  if (bands.length === 0) return null;

  const curve = eqCurve(bands).map((point) => ({
    frequencyHz: point.frequencyHz,
    gainDb: Number(point.gainDb.toFixed(2)),
  }));

  const measured = Object.entries(deviationByBand ?? {}).map(
    ([band, value]) => ({ frequencyHz: Number(band), deviationDb: value }),
  );

  return (
    <div className="rounded-md border p-3">
      <p className="mb-2 text-xs font-medium">Curva de ecualización</p>
      <ChartContainer config={CONFIG} className="aspect-[2/1] w-full">
        <LineChart data={curve} margin={{ left: 4, right: 8, top: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="frequencyHz"
            type="number"
            scale="log"
            domain={[20, 20_000]}
            ticks={OCTAVE_TICKS}
            tickFormatter={formatHz}
            tickLine={false}
            axisLine={false}
            fontSize={10}
          />
          <YAxis
            domain={[-12, 12]}
            ticks={[-12, -6, 0, 6, 12]}
            tickLine={false}
            axisLine={false}
            width={28}
            fontSize={10}
          />
          <ChartTooltip
            content={<ChartTooltipContent labelFormatter={labelHz} />}
          />
          <Line
            dataKey="gainDb"
            stroke="var(--color-gainDb)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          {measured.length > 0 ? (
            <Scatter
              data={measured}
              dataKey="deviationDb"
              fill="var(--color-deviationDb)"
              isAnimationActive={false}
            />
          ) : null}
        </LineChart>
      </ChartContainer>
    </div>
  );
}

function formatHz(value: number): string {
  return value >= 1000 ? `${value / 1000}k` : String(value);
}

function labelHz(value: unknown): string {
  return typeof value === "number" ? `${formatHz(value)} Hz` : String(value);
}
