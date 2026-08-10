// src/features/simulation/components/results/band-chart.tsx — una métrica por banda de octava (§5.4).
//
// Dos series como mucho y en un solo eje: RT60 y EDT comparten segundos, C50 y C80 comparten dB.
// Dos escalas en un mismo gráfico inventarían una correlación que no está en los datos.
//
// Los colores son --chart-2 y --chart-5, no dos peldaños contiguos de la rampa del tema: medidos,
// esos dos separan ΔE 25 en visión normal y 24.6 bajo deuteranopía, mientras que dos peldaños
// vecinos se quedan en 6 y son indistinguibles. La tabla de abajo es el camino sin color al valor.

"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { OCTAVE_BAND_KEYS, type SimulationSummary } from "@/contracts";
import { BandTable } from "@/features/simulation/components/results/band-table";

export type BandSeries = {
  key: string;
  label: string;
  values: SimulationSummary["rt60"];
};

/** Los dos únicos slots validados como par; el orden importa y no se recicla. */
const SERIES_COLORS = ["var(--chart-2)", "var(--chart-5)"] as const;

export function BandChart({
  title,
  unit,
  series,
}: {
  title: string;
  unit: string;
  series: BandSeries[];
}) {
  const present = series.filter((item) => item.values !== undefined);
  if (present.length === 0) return null;

  const config: ChartConfig = Object.fromEntries(
    present.map((item, index) => [
      item.key,
      { label: `${item.label} (${unit})`, color: SERIES_COLORS[index] },
    ]),
  );

  const data = OCTAVE_BAND_KEYS.map((band) => ({
    band: `${band} Hz`,
    ...Object.fromEntries(
      present.map((item) => [item.key, item.values?.[band]]),
    ),
  }));

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{title}</h3>

      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <BarChart data={data} barGap={2}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="band" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={44} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {present.length > 1 ? (
            <ChartLegend content={<ChartLegendContent />} />
          ) : null}
          {present.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              fill={`var(--color-${item.key})`}
              radius={4}
            />
          ))}
        </BarChart>
      </ChartContainer>

      <BandTable unit={unit} series={present} />
    </section>
  );
}
