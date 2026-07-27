// src/features/catalogs/components/material-band-chart.tsx — 2 series (α, s) por banda de
// octava, un solo eje Y (ambas son fracciones de la misma unidad, nunca dos ejes).
// Eje Y auto-escalado a propósito: un domain=[0,1] fijo dispara un bug real de recharts 3.10.1
// donde <Bar> calcula alturas casi nulas aunque <YAxis> pinte los ticks correctos (confirmado
// inspeccionando el SVG). El auto-scale además da mejor resolución visual — casi ningún material
// real se acerca a α=1, así que fijar el eje a [0,1] dejaría las barras minúsculas de cualquier forma.

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
import { OCTAVE_BAND_KEYS } from "@/contracts/bands";
import type { MaterialSpec } from "@/contracts/material-spec.schema";

const chartConfig = {
  absorption: { label: "Absorción (α)", color: "var(--chart-1)" },
  scattering: { label: "Dispersión (s)", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function MaterialBandChart({
  absorption,
  scattering,
}: {
  absorption: MaterialSpec["absorption"];
  scattering: MaterialSpec["scattering"];
}) {
  const data = OCTAVE_BAND_KEYS.map((band) => ({
    band: `${band} Hz`,
    absorption: absorption[band],
    scattering: scattering[band],
  }));

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="band" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="absorption" fill="var(--color-absorption)" radius={4} />
        <Bar dataKey="scattering" fill="var(--color-scattering)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
