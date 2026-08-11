// src/features/room-editor/tools/rect-geometry.ts — el rectángulo axis-aligned que sale de
// arrastrar de esquina a esquina. Lo comparten rect-tool.ts (footprint) y zone-tool.ts (zonas):
// mismo gesto, distinto comando de destino.

import type {
  Point2d,
  Polygon2d,
} from "@/features/room-editor/schemas/room-document";

/** null si el arrastre es tan corto que sería un rectángulo degenerado (un clic sin mover). */
export function rectCorners(
  startM: Point2d,
  endM: Point2d,
  minSideM: number,
): Polygon2d | null {
  const [x0, y0] = startM;
  const [x1, y1] = endM;
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);

  if (maxX - minX < minSideM || maxY - minY < minSideM) return null;

  return [
    [minX, minY],
    [maxX, minY],
    [maxX, maxY],
    [minX, maxY],
  ];
}
