// src/features/room-editor/components/draft-layer.tsx — lo que se está dibujando ahora mismo:
// el muro a medio cerrar, el rectángulo o zona a medio arrastrar, la regla de medición. Nada de
// esto es geometría del documento todavía — por eso vive fuera de las capas de footprint/obstacle/
// opening/zone, que solo pintan lo que ya está persistido en el draft del historial.
//
// TRAMPA: todo aquí lleva listening={false}. El punto donde se suelta un arrastre es, por
// construcción, un VÉRTICE del propio contorno de vista previa — sin esto, ese contorno intercepta
// su propio mouseup (Konva lo escucha por defecto) y room-canvas.tsx nunca ve `event.target` como
// el Stage, así que handlePointerUp no se dispara y el rectángulo se queda a medio dibujar para
// siempre.

"use client";

import { Circle, Line } from "react-konva";
import {
  RectDimensionLabels,
  SegmentLengthLabel,
} from "@/features/room-editor/components/draft-measurement-labels";
import type { CanvasPalette } from "@/features/room-editor/model/canvas-palette";
import { toContentPointPx } from "@/features/room-editor/model/canvas-transform";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";
import { rectCorners } from "@/features/room-editor/tools/rect-geometry";

export function DraftLayer({ palette }: { palette: CanvasPalette }) {
  const draft = useRoomStore((state) => state.draft);
  const viewport = useRoomStore((state) => state.canvasViewport);

  if (draft.kind === "wall") {
    const tail = draft.cursorM
      ? [...draft.pointsM, draft.cursorM]
      : draft.pointsM;
    const points = tail.flatMap((point) => {
      const px = toContentPointPx(point, viewport);
      return [px.x, px.y];
    });
    const lastVertex = draft.pointsM[draft.pointsM.length - 1];
    return (
      <>
        <Line
          points={points}
          stroke={palette.draft}
          strokeWidth={2}
          dash={[6, 4]}
          listening={false}
        />
        {draft.pointsM.map((point, index) => {
          const px = toContentPointPx(point, viewport);
          return (
            <Circle
              // biome-ignore lint/suspicious/noArrayIndexKey: puntos de un trazo en curso, sin id.
              key={index}
              x={px.x}
              y={px.y}
              radius={4}
              fill={palette.draft}
              listening={false}
            />
          );
        })}
        {draft.cursorM && lastVertex ? (
          <SegmentLengthLabel
            startM={lastVertex}
            endM={draft.cursorM}
            viewport={viewport}
            color={palette.measure}
          />
        ) : null}
      </>
    );
  }

  if (draft.kind === "drag") {
    const corners = rectCorners(draft.startM, draft.currentM, 0);
    if (!corners) return null;
    const points = corners.flatMap((point) => {
      const px = toContentPointPx(point, viewport);
      return [px.x, px.y];
    });
    return (
      <>
        <Line
          points={points}
          closed
          stroke={palette.draft}
          strokeWidth={2}
          dash={[6, 4]}
          fill="transparent"
          listening={false}
        />
        <RectDimensionLabels
          corners={corners}
          viewport={viewport}
          color={palette.measure}
        />
      </>
    );
  }

  if (draft.kind === "measure") {
    const start = toContentPointPx(draft.startM, viewport);
    const end = toContentPointPx(draft.currentM, viewport);

    return (
      <>
        <Line
          points={[start.x, start.y, end.x, end.y]}
          stroke={palette.measure}
          strokeWidth={2}
          dash={draft.active ? [6, 4] : undefined}
          listening={false}
        />
        <SegmentLengthLabel
          startM={draft.startM}
          endM={draft.currentM}
          viewport={viewport}
          color={palette.measure}
        />
      </>
    );
  }

  return null;
}
