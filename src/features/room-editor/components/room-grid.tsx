// src/features/room-editor/components/room-grid.tsx — la grilla métrica de fondo (§5.2: "grilla
// métrica, snap 0.1 m"). Solo dibuja líneas de metro en metro (y una más gruesa cada 5 m) dentro de
// lo que el viewport actual deja ver — a escalas muy alejadas una línea por cada 0.1 m saturaría el
// lienzo sin aportar nada legible.
//
// Sin fondo propio: un <Rect> aquí quedaría posicionado en espacio de CONTENIDO (hijo del Stage) y
// se movería con el paneo, dejando huecos en los bordes que el paneo revela. El color de fondo lo
// pone el contenedor CSS del lienzo (room-canvas.tsx), que no tiene ese problema porque no es hijo
// del Stage.

"use client";

import { Line } from "react-konva";
import type { CanvasPalette } from "@/features/room-editor/model/canvas-palette";
import type { CanvasViewport } from "@/features/room-editor/model/canvas-transform";
import { toContentPointPx } from "@/features/room-editor/model/canvas-transform";

const MAJOR_EVERY_M = 5;

export function RoomGrid({
  viewport,
  widthPx,
  heightPx,
  palette,
}: {
  viewport: CanvasViewport;
  widthPx: number;
  heightPx: number;
  palette: CanvasPalette;
}) {
  const minXM = Math.floor(-viewport.originXPx / viewport.scale);
  const maxXM = Math.ceil((widthPx - viewport.originXPx) / viewport.scale);
  const minYM = Math.floor(-viewport.originYPx / viewport.scale);
  const maxYM = Math.ceil((heightPx - viewport.originYPx) / viewport.scale);

  const verticals = rangeM(minXM, maxXM);
  const horizontals = rangeM(minYM, maxYM);

  return (
    <>
      {verticals.map((xM) => {
        const isMajor = xM % MAJOR_EVERY_M === 0;
        const top = toContentPointPx([xM, minYM], viewport);
        const bottom = toContentPointPx([xM, maxYM], viewport);
        return (
          <Line
            key={`v-${xM}`}
            points={[top.x, top.y, bottom.x, bottom.y]}
            stroke={isMajor ? palette.gridMajor : palette.gridMinor}
            strokeWidth={isMajor ? 1 : 0.5}
            listening={false}
          />
        );
      })}
      {horizontals.map((yM) => {
        const isMajor = yM % MAJOR_EVERY_M === 0;
        const left = toContentPointPx([minXM, yM], viewport);
        const right = toContentPointPx([maxXM, yM], viewport);
        return (
          <Line
            key={`h-${yM}`}
            points={[left.x, left.y, right.x, right.y]}
            stroke={isMajor ? palette.gridMajor : palette.gridMinor}
            strokeWidth={isMajor ? 1 : 0.5}
            listening={false}
          />
        );
      })}
    </>
  );
}

function rangeM(min: number, max: number): number[] {
  const values: number[] = [];
  for (let m = min; m <= max; m++) values.push(m);
  return values;
}
