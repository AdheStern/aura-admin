// src/features/room-editor/components/opening-symbols.tsx — el símbolo de ventana/puerta en planta,
// el mismo lenguaje gráfico de un plano de arquitectura: la puerta es un abanico (hoja + arco de
// barrido) y la ventana son dos líneas paralelas al muro. Aparte de opening-layer.tsx porque cada
// símbolo es su propia geometría en píxeles — mezclarla con el bucle de aberturas oscurecería cuál
// es cuál.
//
// Todo en píxeles, no metros: son las mismas coordenadas de pantalla que opening-layer.tsx ya
// convirtió con toContentPointPx (ver la TRAMPA de canvas-transform.ts). El radio del arco de la
// puerta sale de la distancia entre start/end en vez de convertir el ancho de la abertura otra vez,
// porque ya es exactamente esa distancia en píxeles.

"use client";

import type Konva from "konva";
import { Line, Shape } from "react-konva";

type PxPoint = { x: number; y: number };

const WINDOW_OFFSET_PX = 4;
const DOOR_LEAF_STROKE_PX = 1.5;
const DOOR_ARC_STROKE_PX = 1;

type SymbolProps = {
  start: PxPoint;
  end: PxPoint;
  color: string;
  listening: boolean;
  onClick: () => void;
};

export function WindowSymbol({
  start,
  end,
  color,
  listening,
  onClick,
}: SymbolProps) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthPx = Math.hypot(dx, dy) || 1;
  const nx = (-dy / lengthPx) * WINDOW_OFFSET_PX;
  const ny = (dx / lengthPx) * WINDOW_OFFSET_PX;

  return (
    <>
      <Line
        points={[start.x + nx, start.y + ny, end.x + nx, end.y + ny]}
        stroke={color}
        strokeWidth={2}
        listening={listening}
        hitStrokeWidth={12}
        onClick={onClick}
      />
      <Line
        points={[start.x - nx, start.y - ny, end.x - nx, end.y - ny]}
        stroke={color}
        strokeWidth={2}
        listening={listening}
        hitStrokeWidth={12}
        onClick={onClick}
      />
    </>
  );
}

/** `inwardNormal`: unitario, hacia dónde abre la hoja (ver inwardNormalM en polygon-2d.ts) — el
 *  quicio queda fijo en `start`, así que las dos aberturas del mismo muro nunca abren "cruzadas". */
export function DoorSymbol({
  start,
  end,
  inwardNormal,
  color,
  listening,
  onClick,
}: SymbolProps & { inwardNormal: PxPoint }) {
  const radiusPx = Math.hypot(end.x - start.x, end.y - start.y);
  const leafEnd: PxPoint = {
    x: start.x + inwardNormal.x * radiusPx,
    y: start.y + inwardNormal.y * radiusPx,
  };
  const wallAngle = Math.atan2(end.y - start.y, end.x - start.x);
  const leafAngle = Math.atan2(leafEnd.y - start.y, leafEnd.x - start.x);
  // Los dos ángulos están, por construcción, a 90° exactos — pero en cuál sentido (horario o
  // antihorario en el canvas) depende de a qué lado apunte inwardNormal, así que hay que medirlo en
  // vez de asumirlo, o el arco saldría dibujado del lado contrario a la hoja.
  const anticlockwise = normalizeAngle(leafAngle - wallAngle) < 0;

  return (
    <>
      <Line
        points={[start.x, start.y, leafEnd.x, leafEnd.y]}
        stroke={color}
        strokeWidth={DOOR_LEAF_STROKE_PX}
        listening={listening}
        hitStrokeWidth={12}
        onClick={onClick}
      />
      <Shape
        stroke={color}
        strokeWidth={DOOR_ARC_STROKE_PX}
        dash={[3, 3]}
        listening={listening}
        hitStrokeWidth={12}
        onClick={onClick}
        sceneFunc={(ctx: Konva.Context, shape: Konva.Shape) => {
          ctx.beginPath();
          ctx.arc(
            start.x,
            start.y,
            radiusPx,
            wallAngle,
            leafAngle,
            anticlockwise,
          );
          ctx.strokeShape(shape);
        }}
      />
    </>
  );
}

/** A (-π, π]. */
function normalizeAngle(radians: number): number {
  return Math.atan2(Math.sin(radians), Math.cos(radians));
}
