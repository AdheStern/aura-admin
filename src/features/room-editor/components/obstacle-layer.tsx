// src/features/room-editor/components/obstacle-layer.tsx — los pilares. Cada uno vive en un
// <Group> posicionado en su `at`: la figura (rect o círculo) se dibuja en el origen LOCAL del
// grupo, así que arrastrar el grupo es directamente arrastrar el pilar, sin recomputar esquinas.

"use client";

import { Circle, Group, Rect } from "react-konva";
import { useShapeMode } from "@/features/room-editor/hooks/use-shape-mode";
import type { CanvasPalette } from "@/features/room-editor/model/canvas-palette";
import {
  toContentPointPx,
  toModelPointM,
} from "@/features/room-editor/model/canvas-transform";
import { snapPointToGridM } from "@/features/room-editor/model/geometry-2d";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function ObstacleLayer({ palette }: { palette: CanvasPalette }) {
  const obstacles = useRoomStore((state) => state.document.obstacles);
  const viewport = useRoomStore((state) => state.canvasViewport);
  const selection = useRoomStore((state) => state.selection);
  const select = useRoomStore((state) => state.select);
  const updateObstacle = useRoomStore((state) => state.updateObstacle);
  const removeObstacle = useRoomStore((state) => state.removeObstacle);

  // Los pilares se PINTAN siempre (colocar el tercero tiene que enseñar los dos primeros aunque la
  // herramienta "pilar" siga activa); solo su interactividad se apaga fuera de seleccionar/borrar,
  // igual que los muros en footprint-layer.tsx — si no, un pilar bajo el clic de otra herramienta le
  // robaría el evento al Stage.
  const { canErase, isInteractive, canDrag } = useShapeMode();

  return (
    <>
      {obstacles.map((obstacle) => {
        const center = toContentPointPx(obstacle.at, viewport);
        const isSelected =
          selection?.kind === "obstacle" && selection.id === obstacle.id;
        const fill = isSelected ? palette.obstacleSelected : palette.obstacle;

        return (
          <Group
            key={obstacle.id}
            x={center.x}
            y={center.y}
            listening={isInteractive}
            draggable={canDrag}
            onClick={() =>
              canErase
                ? removeObstacle(obstacle.id)
                : select({ kind: "obstacle", id: obstacle.id })
            }
            onDragMove={(event) => {
              const pointM = snapPointToGridM(
                toModelPointM(
                  { x: event.target.x(), y: event.target.y() },
                  viewport,
                ),
              );
              updateObstacle(obstacle.id, { at: pointM });
            }}
          >
            {obstacle.shape === "rect" ? (
              <Rect
                width={obstacle.size[0] * viewport.scale}
                height={obstacle.size[1] * viewport.scale}
                offsetX={(obstacle.size[0] * viewport.scale) / 2}
                offsetY={(obstacle.size[1] * viewport.scale) / 2}
                fill={fill}
                stroke={palette.wall}
                strokeWidth={1}
              />
            ) : (
              <Circle
                radius={obstacle.size[0] * viewport.scale}
                fill={fill}
                stroke={palette.wall}
                strokeWidth={1}
              />
            )}
          </Group>
        );
      })}
    </>
  );
}
