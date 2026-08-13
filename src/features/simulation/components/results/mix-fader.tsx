// src/features/simulation/components/results/mix-fader.tsx — un fader de canal, como en la mesa.
//
// Construido a mano y NO con el Slider de components/ui: ese wrapper está cableado en horizontal
// (`h-1.5 w-full`) y hacerlo vertical obligaría a tocar un primitivo compartido para el único otro
// sitio que lo usa, el trim de caja del editor 3D. Al ser de solo lectura tampoco hace falta su
// semántica interactiva.
//
// De solo lectura a propósito: esto es lo que propuso el modelo. Un fader que se puede arrastrar
// pero no guarda nada promete algo que no cumple, y además mezclaría el criterio de quien lo mueve
// con el del modelo justo en la pantalla donde hay que poder distinguirlos.
//
// El gráfico va aria-hidden porque no aporta nada que no esté ya escrito al lado: el valor en dB y
// el panorama son texto de verdad, que es lo que lee un lector de pantalla.

import { formatGain } from "@/features/simulation/model/mix-clipboard";
import {
  faderPositionPct,
  formatPan,
  unityPositionPct,
} from "@/features/simulation/model/mix-levels";
import type { MixLevel } from "@/features/simulation/schemas/mix-advice";

export function MixFader({ name, level }: { name: string; level: MixLevel }) {
  const position = faderPositionPct(level.gainDb);
  const unity = unityPositionPct();

  return (
    <div className="flex w-16 shrink-0 flex-col items-center gap-1.5">
      <span
        className={`font-mono text-xs font-semibold tabular-nums ${toneOf(level.gainDb)}`}
      >
        {formatGain(level.gainDb)}
      </span>

      <div className="relative h-36 w-full" aria-hidden>
        {/* Raíl */}
        <div className="absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-muted" />

        {/* Relleno desde el 0 dB hacia donde vaya el fader: así se ve de un vistazo quién sube y
            quién baja respecto a la referencia, que es de lo que trata un balance. */}
        <div
          className="absolute left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-primary/60"
          style={{
            bottom: `${Math.min(position, unity)}%`,
            height: `${Math.abs(position - unity)}%`,
          }}
        />

        {/* Línea de unidad */}
        <div
          className="absolute inset-x-0 border-t border-dashed border-foreground/30"
          style={{ bottom: `${unity}%` }}
        />

        {/* Cápsula */}
        <div
          className="absolute left-1/2 h-3 w-7 -translate-x-1/2 translate-y-1/2 rounded-sm border border-background/60 bg-foreground shadow-sm"
          style={{ bottom: `${position}%` }}
        />
      </div>

      <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
        {formatPan(level.panPercent)}
      </span>

      <span
        className="w-full truncate text-center text-[10px] leading-tight"
        title={name}
      >
        {name}
      </span>
    </div>
  );
}

function toneOf(gainDb: number): string {
  if (gainDb > 0) return "text-emerald-600 dark:text-emerald-400";
  if (gainDb < 0) return "text-rose-600 dark:text-rose-400";
  return "text-muted-foreground";
}
