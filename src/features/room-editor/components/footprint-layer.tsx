// src/features/room-editor/components/footprint-layer.tsx — el piso, los muros y sus vértices.
//
// Los vértices se arrastran EN VIVO (onDragMove, no onDragEnd): cada frame llama a moveVertexTo,
// que es exactamente el caso que el historial (Tarea 1) fusiona por coalesceKey — sin eso, un
// arrastre dejaría cientos de entradas de deshacer. Doble click en un muro inserta un vértice donde
// se clicó; un solo click lo selecciona (panel de material) cuando la herramienta activa es
// "seleccionar".

"use client";

import type Konva from "konva";
import { Circle, Line } from "react-konva";
import { useShapeMode } from "@/features/room-editor/hooks/use-shape-mode";
import type { CanvasPalette } from "@/features/room-editor/model/canvas-palette";
import {
  type CanvasViewport,
  toContentPointPx,
  toModelPointM,
} from "@/features/room-editor/model/canvas-transform";
import {
  projectPointOnSegmentM,
  snapPointToGridM,
} from "@/features/room-editor/model/geometry-2d";
import { polygonEdges } from "@/features/room-editor/model/polygon-2d";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

const VERTEX_RADIUS_PX = 5;
const WALL_STROKE_PX = 2;

export function FootprintLayer({ palette }: { palette: CanvasPalette }) {
  const document = useRoomStore((state) => state.document);
  const viewport = useRoomStore((state) => state.canvasViewport);
  const canManage = useRoomStore((state) => state.canManage);
  const selection = useRoomStore((state) => state.selection);
  const select = useRoomStore((state) => state.select);
  const moveVertexTo = useRoomStore((state) => state.moveVertexTo);
  const insertVertexAt = useRoomStore((state) => state.insertVertexAt);
  const removeVertexAt = useRoomStore((state) => state.removeVertexAt);

  const vertices = document.footprint.vertices;
  const walls = document.surfaces.filter((surface) => surface.type === "wall");
  // El muro NO entra en el modo borrador: no se borra suelto, sale de la planta. Dejándolo sordo,
  // la goma le pasa el clic al Stage en vez de fingir una acción que no existe.
  const { canSelect, canErase, isInteractive, canDrag } = useShapeMode();
  const points = vertices.flatMap((vertex) => {
    const px = toContentPointPx(vertex, viewport);
    return [px.x, px.y];
  });

  return (
    <>
      {vertices.length >= 3 ? (
        <Line points={points} closed fill={palette.floor} listening={false} />
      ) : null}

      {polygonEdges(vertices).map((edge, index) => {
        const wall = walls[index];
        const from = toContentPointPx(edge.from, viewport);
        const to = toContentPointPx(edge.to, viewport);
        const isSelected =
          selection?.kind === "surface" && selection.id === wall?.id;

        return (
          <Line
            key={wall?.id ?? `edge-${index}`}
            points={[from.x, from.y, to.x, to.y]}
            stroke={isSelected ? palette.wallSelected : palette.wall}
            strokeWidth={isSelected ? WALL_STROKE_PX + 1 : WALL_STROKE_PX}
            // Solo escucha en modo "seleccionar": fuera de él, un muro bajo el clic de otra
            // herramienta (pilar, ventana) no puede robarle el evento al Stage — ver la nota de
            // room-canvas.tsx sobre event.target === stage.
            listening={canSelect}
            hitStrokeWidth={12}
            onClick={() => {
              if (canSelect && wall) select({ kind: "surface", id: wall.id });
            }}
            onDblClick={(event) => {
              if (!canSelect || !canManage) return;
              const pointM = pointerModelPoint(event, viewport);
              if (!pointM) return;
              const projection = projectPointOnSegmentM(
                pointM,
                edge.from,
                edge.to,
              );
              insertVertexAt(index, projection.pointM);
            }}
          />
        );
      })}

      {isInteractive
        ? vertices.map((vertex, index) => {
            const px = toContentPointPx(vertex, viewport);
            const isSelected =
              selection?.kind === "vertex" && selection.index === index;
            return (
              <Circle
                // biome-ignore lint/suspicious/noArrayIndexKey: sin id propio, con props controladas.
                key={`vertex-${index}`}
                x={px.x}
                y={px.y}
                radius={VERTEX_RADIUS_PX}
                fill={palette.vertexFill}
                stroke={
                  isSelected ? palette.wallSelected : palette.vertexStroke
                }
                strokeWidth={2}
                draggable={canDrag}
                onClick={() =>
                  canErase
                    ? removeVertexAt(index)
                    : select({ kind: "vertex", index })
                }
                onDragMove={(event) => {
                  const pointM = snapPointToGridM(
                    toModelPointM(
                      { x: event.target.x(), y: event.target.y() },
                      viewport,
                    ),
                  );
                  moveVertexTo(index, pointM);
                }}
              />
            );
          })
        : null}
    </>
  );
}

function pointerModelPoint(
  event: Konva.KonvaEventObject<MouseEvent>,
  viewport: CanvasViewport,
) {
  // getRelativePointerPosition (no getPointerPosition): ya neta del paneo del Stage, que es
  // exactamente lo que toModelPointM espera — ver la nota de canvas-transform.ts.
  const stage = event.target.getStage();
  const pointerPx = stage?.getRelativePointerPosition();
  return pointerPx ? toModelPointM(pointerPx, viewport) : null;
}
