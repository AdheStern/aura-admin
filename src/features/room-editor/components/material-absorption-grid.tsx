// src/features/room-editor/components/material-absorption-grid.tsx — α por banda de octava del
// material elegido: un recuadro por banda, teñido según lo absorbente que sea.
//
// Rejilla y no el MaterialBandChart del catálogo: aquel es un recharts pensado para la ficha a
// página completa, y en los 264 px útiles de esta columna sus rótulos de eje se pisan.
//
// La CIFRA va dentro de cada recuadro, no solo el color: α=0.18 y α=0.22 caen en tramos distintos
// y son prácticamente el mismo material, así que el color orienta y el número decide. Es también lo
// que hace admisible el eje rojo→verde aquí (que en el 3D se descartó, ver nrc-color.ts): el color
// es redundante, nadie depende de distinguirlo para leer el dato.

import { OCTAVE_BAND_KEYS, type OctaveBandKey } from "@/contracts/bands";
import type { MaterialSpec } from "@/contracts/material-spec.schema";
import {
  ABSORBENT_FROM,
  type AbsorptionTier,
  absorptionTier,
  REFLECTIVE_BELOW,
} from "@/features/room-editor/model/absorption-tier";
import { cn } from "@/lib/utils";

const TIER_STYLE: Record<AbsorptionTier, { tile: string; dot: string }> = {
  reflective: {
    tile: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  mixed: {
    tile: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  absorbent: {
    tile: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
};

export function MaterialAbsorptionGrid({
  absorption,
}: {
  absorption: MaterialSpec["absorption"];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] text-muted-foreground">
        Absorción (α) por banda
      </span>

      <div className="grid grid-cols-3 gap-1.5">
        {OCTAVE_BAND_KEYS.map((band) => {
          const alpha = absorption[band];
          return (
            <div
              key={band}
              className={cn(
                "rounded-md px-1.5 py-1",
                TIER_STYLE[absorptionTier(alpha)].tile,
              )}
            >
              <div className="text-[9px] font-medium text-muted-foreground uppercase">
                {bandLabel(band)}
              </div>
              <div className="font-mono text-sm font-bold tabular-nums">
                {alpha.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      <TierLegend />
    </div>
  );
}

function TierLegend() {
  const items: [AbsorptionTier, string][] = [
    ["reflective", `Refleja <${REFLECTIVE_BELOW}`],
    ["mixed", "Mixto"],
    ["absorbent", `Absorbe >${ABSORBENT_FROM}`],
  ];

  return (
    <div className="flex items-center justify-between gap-1 text-[9px] text-muted-foreground">
      {items.map(([tier, label]) => (
        <span key={tier} className="flex items-center gap-1">
          <span
            className={cn("size-1.5 rounded-full", TIER_STYLE[tier].dot)}
            aria-hidden
          />
          {label}
        </span>
      ))}
    </div>
  );
}

function bandLabel(band: OctaveBandKey): string {
  const hz = Number(band);
  return hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`;
}
