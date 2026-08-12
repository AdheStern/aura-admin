// src/features/signal-flow/components/speaker-level-slider.tsx — el trim de nivel de una caja,
// compartido por el panel del flujo y el del editor 3D (los dos editan el mismo SpeakerAudio).
//
// La escala está en dB y NO en 0–100. Lo que viaja al motor es un trim en decibelios SOBRE el nivel
// que la cadena eléctrica ya resolvió —potencia del amplificador cruzada con la sensibilidad de la
// caja—, no una fracción de un máximo: 0 dB es "esta caja tal como el sistema la alimenta",
// negativo la atenúa y positivo la empuja. Un 0–100 tendría que inventarse una correspondencia con
// una escala logarítmica, y perdería lo único que hace verificable el número. Los faders físicos,
// de hecho, están rotulados así: en dB, con el 0 en la unidad.
//
// Deslizador en vez de casilla numérica por el rango: es el del contrato, y con un campo libre el
// valor fuera de rango no fallaba al escribirlo sino al guardar.

"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { LEVEL_DB_RANGE } from "@/features/signal-flow/schemas/node-data";

export function SpeakerLevelSlider({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled: boolean;
  onChange: (levelDb: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor="speaker-level">Nivel</Label>
        <span className="font-mono text-xs tabular-nums">
          {formatDb(value)}
        </span>
      </div>

      <Slider
        id="speaker-level"
        min={LEVEL_DB_RANGE.min}
        max={LEVEL_DB_RANGE.max}
        step={LEVEL_DB_RANGE.step}
        value={value}
        disabled={disabled}
        onValueChange={(next) =>
          onChange(typeof next === "number" ? next : next[0])
        }
      />

      <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
        <span>{formatDb(LEVEL_DB_RANGE.min)}</span>
        <span>{formatDb(LEVEL_DB_RANGE.max)}</span>
      </div>

      {/* Qué significa el 0 es la pregunta que hace todo el mundo al ver este campo: sin esta
          línea se lee como un volumen absoluto y "0" parece silencio. */}
      <p className="text-[10px] leading-snug text-muted-foreground">
        0 dB deja la caja al nivel que resuelve la cadena eléctrica; esto solo
        la sube o la baja respecto a eso.
      </p>
    </div>
  );
}

function formatDb(db: number): string {
  return `${db > 0 ? "+" : ""}${db.toFixed(1)} dB`;
}
