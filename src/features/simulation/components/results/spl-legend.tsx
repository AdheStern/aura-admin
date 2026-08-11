// src/features/simulation/components/results/spl-legend.tsx — la escala del mapa, siempre visible.
//
// El mapa codifica magnitud con cuatro tonos, que es la excepción de "calor semántico" a la regla
// de un solo tono. Esa excepción solo vale con la escala a la vista: sin ella el color no dice
// cuántos dB son y el mapa pasa a ser decoración.

import {
  SPL_MAX_DB,
  SPL_MIN_DB,
  splLegendStops,
} from "@/features/simulation/model/spl-scale";

export function SplLegend({ unit }: { unit: string }) {
  const stops = splLegendStops();
  const ramp = stops
    .map(
      (stop, index) => `${stop.color} ${(index / (stops.length - 1)) * 100}%`,
    )
    .join(", ");

  return (
    <div className="flex flex-col gap-1">
      <div
        className="h-3 w-full rounded-sm"
        style={{ background: `linear-gradient(to right, ${ramp})` }}
      />
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        {stops.map((stop) => (
          <span key={stop.db}>{stop.db}</span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Nivel en {unit} · escala fija {SPL_MIN_DB}–{SPL_MAX_DB} dB
      </p>
    </div>
  );
}
