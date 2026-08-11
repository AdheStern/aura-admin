// src/features/room-editor/components/opening-layer.tsx — ventanas y puertas sobre el muro,
// dibujadas con el símbolo de un plano de verdad (opening-symbols.tsx): la puerta como abanico
// (hoja + arco de barrido) y la ventana como doble línea, no como un tramo de color plano.
//
// El plano es una vista CENITAL: `rect.y`/`rect.height` (sill y alto) no tienen un lugar en 2D —
// esas dos cotas solo importan cuando el editor 3D (Fase 4) extruya el muro. Aquí una abertura es
// un tramo entre `x` y `x + width` medidos a lo largo del muro.
//
// v1 no arrastra: reposicionar es borrar y volver a colocar, o teclear `x` en el panel. Una
// abertura solo puede moverse A LO LARGO de su muro, y constreñir un drag de Konva a esa única
// dimensión (sin que se despegue visualmente de la línea mientras tanto) no paga su complejidad
// frente al panel numérico, que ya cubre el caso de ajuste fino.

"use client";

import {
  DoorSymbol,
  WindowSymbol,
} from "@/features/room-editor/components/opening-symbols";
import { useShapeMode } from "@/features/room-editor/hooks/use-shape-mode";
import type { CanvasPalette } from "@/features/room-editor/model/canvas-palette";
import { toContentPointPx } from "@/features/room-editor/model/canvas-transform";
import {
  inwardNormalM,
  polygonEdges,
} from "@/features/room-editor/model/polygon-2d";
import { wallEdgeIndexOf } from "@/features/room-editor/model/wall-surfaces";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function OpeningLayer({ palette }: { palette: CanvasPalette }) {
  const document = useRoomStore((state) => state.document);
  const viewport = useRoomStore((state) => state.canvasViewport);
  const selection = useRoomStore((state) => state.selection);
  const select = useRoomStore((state) => state.select);
  const removeOpening = useRoomStore((state) => state.removeOpening);

  // Se pinta siempre (ver el porqué en obstacle-layer.tsx); solo su interactividad se apaga fuera
  // de seleccionar/borrar.
  const { canErase, isInteractive } = useShapeMode();
  const edges = polygonEdges(document.footprint.vertices);

  return (
    <>
      {document.openings.flatMap((opening) => {
        const edgeIndex = wallEdgeIndexOf(document.surfaces, opening.surfaceId);
        const edge = edgeIndex === null ? null : edges[edgeIndex];
        if (!edge) return [];

        const lengthM = Math.hypot(
          edge.to[0] - edge.from[0],
          edge.to[1] - edge.from[1],
        );
        if (lengthM === 0) return [];

        const [xM, , widthM] = opening.rect;
        const dir: [number, number] = [
          (edge.to[0] - edge.from[0]) / lengthM,
          (edge.to[1] - edge.from[1]) / lengthM,
        ];
        const start = toContentPointPx(
          [edge.from[0] + dir[0] * xM, edge.from[1] + dir[1] * xM],
          viewport,
        );
        const end = toContentPointPx(
          [
            edge.from[0] + dir[0] * (xM + widthM),
            edge.from[1] + dir[1] * (xM + widthM),
          ],
          viewport,
        );
        const isSelected =
          selection?.kind === "opening" && selection.id === opening.id;
        const color = isSelected ? palette.openingSelected : palette.opening;
        const onClick = () =>
          canErase
            ? removeOpening(opening.id)
            : select({ kind: "opening", id: opening.id });

        if (opening.type === "window") {
          return [
            <WindowSymbol
              key={opening.id}
              start={start}
              end={end}
              color={color}
              listening={isInteractive}
              onClick={onClick}
            />,
          ];
        }

        const [nxM, nyM] = inwardNormalM(edge, document.footprint.vertices);
        return [
          <DoorSymbol
            key={opening.id}
            start={start}
            end={end}
            inwardNormal={{ x: nxM, y: nyM }}
            color={color}
            listening={isInteractive}
            onClick={onClick}
          />,
        ];
      })}
    </>
  );
}
