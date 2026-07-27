// src/features/catalogs/components/speaker-frequency-response-chart.tsx — 1 serie: sin leyenda
// (el título ya la nombra), marcadores en los puntos reales del datasheet (no es muestreo denso).

"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";

const chartConfig = {
  db: { label: "dB relativos", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function SpeakerFrequencyResponseChart({
  curve,
}: {
  curve: SpeakerSpec["frequencyResponse"]["curve"];
}) {
  const data = curve.map(([hz, db]) => ({ hz, db }));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <LineChart data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="hz"
          type="number"
          scale="log"
          domain={["auto", "auto"]}
          tickFormatter={(hz: number) => `${hz}`}
          label={{ value: "Hz", position: "insideBottom", offset: -4 }}
        />
        <YAxis label={{ value: "dB", angle: -90, position: "insideLeft" }} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Line
          dataKey="db"
          type="monotone"
          stroke="var(--color-db)"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
