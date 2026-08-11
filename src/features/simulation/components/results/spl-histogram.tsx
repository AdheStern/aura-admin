// src/features/simulation/components/results/spl-histogram.tsx — reparto del nivel en la audiencia.
//
// Es la lectura visual de la uniformidad: σ resume en un número lo que aquí se ve como ancho. Dos
// salas con la misma media pueden tener una cresta estrecha o una meseta de veinte dB, y esa
// diferencia es la que decide si el fondo oye lo mismo que la primera fila.
//
// Una sola serie: un solo color, sin leyenda — el título ya la nombra.

"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const BIN_DB = 1;

const chartConfig = {
  points: { label: "Puntos de escucha", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function SplHistogram({ values }: { values: number[] }) {
  if (values.length === 0) return null;

  const data = bin(values);

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">
        Reparto del nivel ({values.length} puntos, bins de {BIN_DB} dB)
      </h3>

      <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
        <BarChart data={data}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={32}
            allowDecimals={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="points" fill="var(--color-points)" radius={4} />
        </BarChart>
      </ChartContainer>
    </section>
  );
}

function bin(values: number[]): { label: string; points: number }[] {
  const low = Math.floor(Math.min(...values) / BIN_DB) * BIN_DB;
  const high = Math.ceil(Math.max(...values) / BIN_DB) * BIN_DB;

  const counts = new Map<number, number>();
  for (let edge = low; edge < high; edge += BIN_DB) counts.set(edge, 0);
  for (const value of values) {
    const edge = Math.min(Math.floor(value / BIN_DB) * BIN_DB, high - BIN_DB);
    counts.set(edge, (counts.get(edge) ?? 0) + 1);
  }

  return [...counts.entries()].map(([edge, points]) => ({
    label: `${edge}`,
    points,
  }));
}
