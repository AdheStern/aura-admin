// src/features/simulation/components/results/mix-eq-bands.tsx — las bandas, como se teclean.
//
// La curva de arriba se lee de un vistazo pero no se puede copiar a un equipo; estas cifras sí. Van
// las dos porque son la misma información en los dos lenguajes que un operador usa.
//
// Ordenadas por frecuencia y no por el índice `band` que manda el modelo: en un ecualizador las
// bandas se leen de graves a agudos, y el modelo numera en el orden en que se le ocurren.

import { Badge } from "@/components/ui/badge";
import {
  filterLabel,
  formatGain,
  formatHz,
} from "@/features/simulation/model/mix-clipboard";
import type { MixBand } from "@/features/simulation/schemas/mix-advice";

export function MixEqBands({ bands }: { bands: MixBand[] }) {
  if (bands.length === 0) return null;

  const ordered = [...bands].sort((a, b) => a.frequencyHz - b.frequencyHz);

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {ordered.map((band) => (
        <li
          key={`${band.band}-${band.frequencyHz}`}
          className="rounded-md border p-2"
        >
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-mono text-sm font-semibold tabular-nums">
              {formatHz(band.frequencyHz)}
            </span>
            <span
              className={`font-mono text-sm tabular-nums ${gainTone(band)}`}
            >
              {formatGain(band.gainDb)}
            </span>
            <span className="text-xs text-muted-foreground">Q {band.q}</span>
            <Badge variant="outline" className="text-[10px]">
              {filterLabel(band.filterType)}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {band.description}
          </p>
        </li>
      ))}
    </ul>
  );
}

function gainTone(band: MixBand): string {
  // Un corte no tiene ganancia: colorearlo por su gainDb (a menudo 0) lo pintaría de neutro cuando
  // en realidad es lo más agresivo del strip.
  if (band.filterType === "high_pass" || band.filterType === "low_pass") {
    return "text-muted-foreground";
  }
  if (band.gainDb > 0) return "text-emerald-600 dark:text-emerald-400";
  if (band.gainDb < 0) return "text-rose-600 dark:text-rose-400";
  return "text-muted-foreground";
}
