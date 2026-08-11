// src/features/simulation/components/results/spl-map.tsx — mapa de SPL en planta (§5.4).
//
// Cenital y en SVG: la grilla del motor es plana (un punto por posición a la altura de oído), así
// que una vista en planta la muestra entera sin que nada tape nada. La textura sobre el 3D es la
// otra mitad de §5.4 y va sobre esta misma escala.
//
// Cada punto se pinta como su celda de grilla, del lado que dijo `resolutionM`. Dibujarlos como
// discos de radio arbitrario sugeriría una precisión de interpolación que el motor no entregó: lo
// que hay es un valor por celda.

"use client";

import { useId } from "react";
import type { SimulationGrid } from "@/contracts";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";
import { SplLegend } from "@/features/simulation/components/results/spl-legend";
import { splColor } from "@/features/simulation/model/spl-scale";

/** Un metro de aire alrededor para que la planta no toque el borde del cuadro. */
const PADDING_M = 1;

const MAX_HEIGHT_REM = 28;

export function SplMap({
  grid,
  values,
  document,
  resolutionM,
  unit,
}: {
  grid: SimulationGrid;
  /** Alineado índice a índice con grid.points, como garantiza el contrato. */
  values: number[];
  document: RoomDocument | null;
  resolutionM: number;
  unit: string;
}) {
  const clipId = useId();
  const box = bounds(grid.points, document);
  if (!box) return null;

  const outline = document?.footprint.vertices ?? [];

  return (
    <div className="flex flex-col gap-3">
      {/* El ancho se limita a lo que ocupa la planta con la altura máxima: sin esto el SVG se
          estira a todo el contenedor, encaja el dibujo en el centro y el borde queda rodeando dos
          franjas vacías que parecen parte del mapa. */}
      <div
        className="w-full"
        style={{ maxWidth: `${MAX_HEIGHT_REM * (box.width / box.height)}rem` }}
      >
        <svg
          viewBox={`${box.minX} ${box.minY} ${box.width} ${box.height}`}
          className="h-auto w-full rounded-md border bg-card"
          // El eje Y del recinto crece hacia el norte y el de SVG hacia abajo: sin esto el mapa sale
          // reflejado respecto al editor 2D, que es donde el usuario colocó todo.
          style={{ transform: "scaleY(-1)", maxHeight: `${MAX_HEIGHT_REM}rem` }}
          role="img"
          // El nombre accesible va aquí y no en un <title> dentro del SVG: React 19 iza los <title>
          // al <head> como metadatos del documento, y dentro de un <svg> eso rompe la hidratación.
          aria-label={`Mapa de nivel sonoro en ${unit}`}
        >
          <clipPath id={clipId}>
            {outline.length > 2 ? (
              <polygon
                points={outline.map(([x, y]) => `${x},${y}`).join(" ")}
              />
            ) : (
              <rect
                x={box.minX}
                y={box.minY}
                width={box.width}
                height={box.height}
              />
            )}
          </clipPath>

          {/* crispEdges quita las costuras entre celdas: con antialiasing, dos rects que comparten
            arista dejan ver el fondo por la fracción de píxel que ninguno de los dos cubre, y el
            mapa aparece cuadriculado por una rejilla que no significa nada. */}
          <g clipPath={`url(#${clipId})`} shapeRendering="crispEdges">
            {grid.points.map(([x, y], index) => (
              <rect
                key={`${x}-${y}`}
                x={x - resolutionM / 2}
                y={y - resolutionM / 2}
                width={resolutionM}
                height={resolutionM}
                fill={splColor(values[index])}
              />
            ))}
          </g>

          {outline.length > 2 ? (
            <polygon
              points={outline.map(([x, y]) => `${x},${y}`).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth={box.width / 400}
              className="text-border"
            />
          ) : null}
        </svg>
      </div>

      <SplLegend unit={unit} />
    </div>
  );
}

type Box = { minX: number; minY: number; width: number; height: number };

function bounds(
  points: readonly (readonly number[])[],
  document: RoomDocument | null,
): Box | null {
  const xs = [
    ...points.map((p) => p[0]),
    ...(document?.footprint.vertices.map(([x]) => x) ?? []),
  ];
  const ys = [
    ...points.map((p) => p[1]),
    ...(document?.footprint.vertices.map(([, y]) => y) ?? []),
  ];
  if (xs.length === 0) return null;

  const minX = Math.min(...xs) - PADDING_M;
  const minY = Math.min(...ys) - PADDING_M;

  return {
    minX,
    minY,
    width: Math.max(...xs) + PADDING_M - minX,
    height: Math.max(...ys) + PADDING_M - minY,
  };
}
