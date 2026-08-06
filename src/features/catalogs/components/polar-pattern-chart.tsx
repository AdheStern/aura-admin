// src/features/catalogs/components/polar-pattern-chart.tsx — diagrama polar (una serie).
//
// Lo comparten el patrón del micrófono y la cobertura del parlante: los dos son magnitud
// normalizada frente a ángulo, así que se leen en la misma escala y con los mismos anillos.
//
// Una sola serie por gráfico a propósito. La cobertura H y V de un parlante van en dos diagramas
// separados, como en cualquier ficha de fabricante: superponerlas invita a leer un plano por el
// otro, y con una serie el título ya nombra el dato y sobra la leyenda.

"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { PolarSample } from "@/features/catalogs/directivity";

const chartConfig = {
  magnitude: { label: "Nivel relativo", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** Anillos en los −6 dB (0.5) y −12 dB (0.25), que son las referencias que se leen de un polar. */
const RING_TICKS = [0.25, 0.5, 0.75, 1];

/** Solo los cuatro puntos cardinales: con 72 muestras, etiquetar más es ruido ilegible. */
const LABELLED_ANGLES = new Set([0, 90, 180, 270]);

export function PolarPatternChart({
  samples,
  className,
}: {
  samples: PolarSample[];
  className?: string;
}) {
  return (
    <ChartContainer
      config={chartConfig}
      className={className ?? "aspect-square w-full max-w-56"}
    >
      <RadarChart data={samples} outerRadius="72%">
        {/* Sin radios: Recharts dibuja uno por muestra y con 72 muestras la rejilla tapa el
            lóbulo, que es justo el dato. Quedan los anillos, que son la referencia de nivel. */}
        <PolarGrid
          gridType="circle"
          radialLines={false}
          className="stroke-border"
        />
        <PolarAngleAxis
          dataKey="angleDeg"
          tick={{ fontSize: 10 }}
          tickFormatter={(angle: number) =>
            LABELLED_ANGLES.has(angle) ? `${angle}°` : ""
          }
        />
        <PolarRadiusAxis
          domain={[0, 1]}
          ticks={RING_TICKS}
          tick={false}
          axisLine={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(angle) => `${angle}° fuera de eje`}
            />
          }
        />
        <Radar
          dataKey="magnitude"
          stroke="var(--color-magnitude)"
          strokeWidth={2}
          fill="var(--color-magnitude)"
          fillOpacity={0.18}
          dot={false}
          isAnimationActive={false}
        />
      </RadarChart>
    </ChartContainer>
  );
}
