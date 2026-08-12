// src/features/simulation/components/results/summary-tiles.tsx — los escalares de cabecera.
//
// Cada uno es un número y punto, así que van como fichas y no como gráfico: un gráfico de una barra
// es una ficha con ruido alrededor.
//
// splDirectDb, splReverberantDb, splTotalDb, roomConstantM2 y criticalDistanceM están referidos a
// 10 m y 1 kHz. El contrato no transporta esa referencia (ADR 0004) y sin decirla el número no
// significa nada, así que la lleva escrita cada ficha afectada.

import { Card, CardContent } from "@/components/ui/card";
import type { SimulationSummary } from "@/contracts";

const AT_10M_1KHZ = "a 10 m · 1 kHz";

type Tile = {
  key: keyof SimulationSummary;
  label: string;
  unit: string;
  digits?: number;
  note?: string;
};

// Nivel medio, uniformidad y RT60 de Sabine NO están aquí: los enseña el veredicto de arriba, que
// existe justo para eso. Repetir la misma cifra a cuatrocientos píxeles no añade nada y obliga a
// comprobar que las dos dicen lo mismo.
const TILES: Tile[] = [
  { key: "splMinDb", label: "Nivel mínimo", unit: "dBA" },
  { key: "splMaxDb", label: "Nivel máximo", unit: "dBA" },
  { key: "rt60EyringS", label: "RT60 (Eyring)", unit: "s" },
  {
    key: "schroederHz",
    label: "Frecuencia de Schroeder",
    unit: "Hz",
    digits: 1,
  },
  {
    key: "criticalDistanceM",
    label: "Distancia crítica",
    unit: "m",
    note: AT_10M_1KHZ,
  },
  {
    key: "roomConstantM2",
    label: "Constante de sala",
    unit: "m²",
    digits: 1,
    note: AT_10M_1KHZ,
  },
  { key: "splTotalDb", label: "Nivel total", unit: "dB", note: AT_10M_1KHZ },
  { key: "d50AvgPct", label: "D50 medio", unit: "%", digits: 1 },
  { key: "drrAvgDb", label: "DRR medio", unit: "dB" },
];

export function SummaryTiles({ scalars }: { scalars: SimulationSummary }) {
  const present = TILES.filter((tile) => typeof scalars[tile.key] === "number");
  if (present.length === 0) return null;

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {present.map((tile) => (
        <Card key={tile.key}>
          <CardContent className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{tile.label}</span>
            <span className="text-2xl font-semibold">
              {(scalars[tile.key] as number).toFixed(tile.digits ?? 2)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                {tile.unit}
              </span>
            </span>
            {tile.note ? (
              <span className="text-xs text-muted-foreground">{tile.note}</span>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
