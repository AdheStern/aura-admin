// src/features/simulation/components/results/panel-plan.tsx — la planta con los paneles colocados.
//
// Plano propio y NO el mapa de calor: ese sale de la física del motor y esto lo propone un modelo.
// Superponerlos mezclaría en un solo dibujo las dos cosas que el resto de la pantalla se ocupa de
// mantener separadas, y no habría forma de decir cuál de los dos trazos está medido.
//
// Mismo marco que el mapa de SPL —viewBox en metros y `scaleY(-1)` para que el norte quede arriba—
// para que las dos plantas se lean como la misma sala. Por eso las etiquetas van fuera, en DOM:
// dentro saldrían del revés y con el tamaño atado al de la sala.
//
// Cada panel se dibuja separado del muro hacia dentro, no encima: encima, su trazo y el del contorno
// se funden en uno y no se ve dónde acaba la pared y empieza el tratamiento.

"use client";

import type { Polygon2d } from "@/features/room-editor/schemas/room-document";
import type { PlacedPanel } from "@/features/simulation/model/panel-placement";

/** Un metro de aire alrededor, igual que el mapa de SPL. */
const PADDING_M = 1;

const MAX_HEIGHT_REM = 22;

export function PanelPlan({
  footprint,
  placed,
}: {
  footprint: Polygon2d;
  placed: PlacedPanel[];
}) {
  const box = bounds(footprint);
  if (!box) return null;

  const outline = footprint.map(([x, y]) => `${x},${y}`).join(" ");
  const stroke = box.width / 260;

  return (
    <div
      className="w-full"
      style={{ maxWidth: `${MAX_HEIGHT_REM * (box.width / box.height)}rem` }}
    >
      <svg
        viewBox={`${box.minX} ${box.minY} ${box.width} ${box.height}`}
        className="h-auto w-full rounded-md border bg-card"
        style={{ transform: "scaleY(-1)", maxHeight: `${MAX_HEIGHT_REM}rem` }}
        role="img"
        aria-label={`Planta con ${placed.length} paneles absorbentes propuestos`}
      >
        <polygon
          points={outline}
          className="fill-muted/30 text-border"
          stroke="currentColor"
          strokeWidth={stroke}
        />

        {placed.map((item, index) => (
          <g key={`${item.panel.wallIndex}-${item.panel.startM}`}>
            <line
              x1={item.from[0]}
              y1={item.from[1]}
              x2={item.to[0]}
              y2={item.to[1]}
              className="text-amber-500"
              stroke="currentColor"
              strokeWidth={stroke * 5}
              strokeLinecap="round"
            />
            {/* El número va contraescalado: el SVG entero está volteado en Y para que el norte
                quede arriba, y sin esto el dígito sale del revés. */}
            <text
              x={item.midpoint[0]}
              y={item.midpoint[1]}
              transform={`scale(1,-1) translate(0, ${-2 * item.midpoint[1]})`}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={box.width / 28}
              className="fill-amber-950 dark:fill-amber-50"
            >
              {index + 1}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

type Box = { minX: number; minY: number; width: number; height: number };

function bounds(footprint: Polygon2d): Box | null {
  if (footprint.length === 0) return null;

  const xs = footprint.map(([x]) => x);
  const ys = footprint.map(([, y]) => y);
  const minX = Math.min(...xs) - PADDING_M;
  const minY = Math.min(...ys) - PADDING_M;

  return {
    minX,
    minY,
    width: Math.max(...xs) + PADDING_M - minX,
    height: Math.max(...ys) + PADDING_M - minY,
  };
}
