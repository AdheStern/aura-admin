// src/features/simulation/components/results/map-ruler.tsx — las reglas del mapa en planta.
//
// Van FUERA del SVG, en DOM normal, por dos razones que se ven en cuanto se intenta al revés: el
// mapa lleva `scaleY(-1)` para que el norte quede arriba, así que cualquier texto dentro sale del
// revés; y su viewBox está en metros, así que un `font-size` dentro escala con el recinto y la
// misma etiqueta resulta ilegible en una sala de 6 m y enorme en una nave de 40.
//
// Alineadas por porcentaje sobre el mismo tramo que el viewBox del mapa, que se estira al ancho del
// contenedor conservando la proporción: cada marca cae sobre su metro sin medir el DOM.

import {
  formatMetres,
  type RulerTick,
} from "@/features/simulation/model/map-ruler";

export function HorizontalRuler({ ticks }: { ticks: RulerTick[] }) {
  return (
    <div className="relative h-5 select-none" aria-hidden>
      {ticks.map((tick) => (
        <div
          key={tick.valueM}
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${tick.positionPct}%` }}
        >
          <span className="h-1 w-px bg-border" />
          <span className="text-[10px] leading-tight text-muted-foreground tabular-nums">
            {formatMetres(tick.valueM)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function VerticalRuler({ ticks }: { ticks: RulerTick[] }) {
  return (
    /* Ocupa la celda entera de la rejilla, que es exactamente lo que mide el mapa a su lado: así
       el porcentaje de cada marca cae sobre su metro sin depender de un ancho fijo. */
    <div className="relative h-full w-full select-none" aria-hidden>
      {ticks.map((tick) => (
        <div
          key={tick.valueM}
          className="absolute right-0 flex translate-y-1/2 items-center gap-1"
          style={{ bottom: `${tick.positionPct}%` }}
        >
          <span className="text-[10px] leading-tight text-muted-foreground tabular-nums">
            {formatMetres(tick.valueM)}
          </span>
          <span className="h-px w-1 bg-border" />
        </div>
      ))}
    </div>
  );
}
