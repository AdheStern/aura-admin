// src/features/room-editor/components/zone-layer.tsx — zona de escenario y zonas de audiencia.
//
// El arrastre traslada el polígono entero y se confirma solo en onDragEnd (un único
// moveZoneTo, no uno por frame): a diferencia de un vértice, mover una zona no tiene un
// coalesceKey que fusione cientos de pasos en uno, así que ir comando por frame llenaría el
// historial. `target.position({x:0,y:0})` inmediatamente después de leer el delta evita el
// parpadeo de un frame con el offset de Konva antes de que React vuelva a controlar la posición.

"use client";

import type Konva from "konva";
import { Line } from "react-konva";
import { useShapeMode } from "@/features/room-editor/hooks/use-shape-mode";
import type { CanvasPalette } from "@/features/room-editor/model/canvas-palette";
import {
  pxToM,
  toContentPointPx,
} from "@/features/room-editor/model/canvas-transform";
import type { Point2d } from "@/features/room-editor/schemas/room-document";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function ZoneLayer({ palette }: { palette: CanvasPalette }) {
  const document = useRoomStore((state) => state.document);
  const viewport = useRoomStore((state) => state.canvasViewport);
  const selection = useRoomStore((state) => state.selection);
  const select = useRoomStore((state) => state.select);
  const moveZoneTo = useRoomStore((state) => state.moveZoneTo);
  const removeZone = useRoomStore((state) => state.removeZone);

  // Se pinta siempre (ver el porqué en obstacle-layer.tsx); solo su interactividad se apaga fuera
  // de seleccionar/borrar.
  const { canErase, isInteractive, canDrag } = useShapeMode();

  function pickZone(id: string) {
    if (canErase) removeZone(id);
    else select({ kind: "zone", id });
  }

  function handleDragEnd(id: string, event: Konva.KonvaEventObject<DragEvent>) {
    const deltaM: Point2d = [
      pxToM(event.target.x(), viewport),
      pxToM(event.target.y(), viewport),
    ];
    event.target.position({ x: 0, y: 0 });
    moveZoneTo(id, deltaM);
  }

  return (
    <>
      {document.zones.stage ? (
        <ZonePolygon
          id={document.zones.stage.id}
          polygon={document.zones.stage.polygon}
          fill={palette.stageZone}
          stroke={palette.stageZoneStroke}
          selected={
            selection?.kind === "zone" &&
            selection.id === document.zones.stage.id
          }
          listening={isInteractive}
          draggable={canDrag}
          viewport={viewport}
          onPick={pickZone}
          onDragEnd={handleDragEnd}
        />
      ) : null}
      {document.zones.audience.map((zone) => (
        <ZonePolygon
          key={zone.id}
          id={zone.id}
          polygon={zone.polygon}
          fill={palette.audienceZone}
          stroke={palette.audienceZoneStroke}
          selected={selection?.kind === "zone" && selection.id === zone.id}
          listening={isInteractive}
          draggable={canDrag}
          viewport={viewport}
          onPick={pickZone}
          onDragEnd={handleDragEnd}
        />
      ))}
    </>
  );
}

function ZonePolygon({
  id,
  polygon,
  fill,
  stroke,
  selected,
  listening,
  draggable,
  viewport,
  onPick,
  onDragEnd,
}: {
  id: string;
  polygon: Point2d[];
  fill: string;
  stroke: string;
  selected: boolean;
  listening: boolean;
  draggable: boolean;
  viewport: Parameters<typeof toContentPointPx>[1];
  /** Seleccionar o borrar según la herramienta activa: lo decide el padre, que es quien sabe. */
  onPick: (id: string) => void;
  onDragEnd: (id: string, event: Konva.KonvaEventObject<DragEvent>) => void;
}) {
  const points = polygon.flatMap((point) => {
    const px = toContentPointPx(point, viewport);
    return [px.x, px.y];
  });

  return (
    <Line
      points={points}
      closed
      fill={fill}
      stroke={stroke}
      strokeWidth={selected ? 3 : 1.5}
      listening={listening}
      draggable={draggable}
      onClick={() => onPick(id)}
      onDragEnd={(event) => onDragEnd(id, event)}
    />
  );
}
