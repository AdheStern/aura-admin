// src/features/simulation/components/results/band-table.tsx — el gemelo sin color del gráfico.
//
// Todo gráfico continuo lleva su tabla: el color y el tooltip no pueden ser el único camino a un
// número. Va plegada para no competir con el gráfico, pero está siempre y es la misma verdad.

import { OCTAVE_BAND_KEYS } from "@/contracts";
import type { BandSeries } from "@/features/simulation/components/results/band-chart";

export function BandTable({
  unit,
  series,
}: {
  unit: string;
  series: BandSeries[];
}) {
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
        Ver los números
      </summary>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b">
              <th className="py-1 pr-3 font-medium">Banda</th>
              {series.map((item) => (
                <th key={item.key} className="py-1 pr-3 font-medium">
                  {item.label} ({unit})
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OCTAVE_BAND_KEYS.map((band) => (
              <tr key={band} className="border-b last:border-0">
                <th className="py-1 pr-3 font-normal text-muted-foreground">
                  {band} Hz
                </th>
                {series.map((item) => (
                  <td key={item.key} className="py-1 pr-3 tabular-nums">
                    {item.values?.[band]?.toFixed(2) ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
