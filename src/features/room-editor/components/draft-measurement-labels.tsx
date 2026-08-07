// src/features/room-editor/components/draft-measurement-labels.tsx — las etiquetas de longitud que
// acompañan un trazo en curso: la "regla en tiempo real" que draft-layer.tsx superpone al muro, al
// rectángulo y a la medición mientras se dibujan. Aparte de draft-layer.tsx porque son SOLO texto
// derivado de la geometría — separarlas evita que el límite de líneas del componente empuje a
// comprimir la lectura de los tres casos de `draft.kind`.

"use client";

import { Text } from "react-konva";
import type { CanvasViewport } from "@/features/room-editor/model/canvas-transform";
import { toContentPointPx } from "@/features/room-editor/model/canvas-transform";
import { distanceM } from "@/features/room-editor/model/geometry-2d";
import type {
  Point2d,
  Polygon2d,
} from "@/features/room-editor/schemas/room-document";

const LABEL_FONT_SIZE = 12;

export function SegmentLengthLabel({
  startM,
  endM,
  viewport,
  color,
}: {
  startM: Point2d;
  endM: Point2d;
  viewport: CanvasViewport;
  color: string;
}) {
  const start = toContentPointPx(startM, viewport);
  const end = toContentPointPx(endM, viewport);
  const lengthM = distanceM(startM, endM);

  return (
    <Text
      x={(start.x + end.x) / 2 + 6}
      y={(start.y + end.y) / 2 - 16}
      text={`${lengthM.toFixed(2)} m`}
      fill={color}
      fontSize={LABEL_FONT_SIZE}
      listening={false}
    />
  );
}

/** `corners` viene de rectCorners: [inf-izq, inf-der, sup-der, sup-izq] en metros (CCW, con y
 *  creciendo hacia abajo). Etiqueta el lado superior con el ancho y el derecho con el alto — los
 *  dos lados visibles sin importar desde qué esquina se arrastró. */
export function RectDimensionLabels({
  corners,
  viewport,
  color,
}: {
  corners: Polygon2d;
  viewport: CanvasViewport;
  color: string;
}) {
  const [topLeft, topRight, bottomRight] = corners.map((point) =>
    toContentPointPx(point, viewport),
  );
  const widthM = distanceM(corners[0], corners[1]);
  const heightM = distanceM(corners[1], corners[2]);

  return (
    <>
      <Text
        x={topLeft.x}
        y={topLeft.y - 18}
        width={topRight.x - topLeft.x}
        align="center"
        text={`${widthM.toFixed(2)} m`}
        fill={color}
        fontSize={LABEL_FONT_SIZE}
        listening={false}
      />
      <Text
        x={topRight.x + 6}
        y={topRight.y}
        height={bottomRight.y - topRight.y}
        verticalAlign="middle"
        text={`${heightM.toFixed(2)} m`}
        fill={color}
        fontSize={LABEL_FONT_SIZE}
        listening={false}
      />
    </>
  );
}
