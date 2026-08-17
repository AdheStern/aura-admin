// src/features/room-editor/components/floor-capture-stage.tsx — la foto y las cuatro esquinas.
//
// Se toca sobre una foto CONGELADA, no sobre el vídeo en directo. Es lo que hace que las esquinas
// signifiquen algo: sobre el vídeo, mover el móvil entre el primer toque y el cuarto dejaría cuatro
// puntos de cuatro encuadres distintos, y la proporción saldría de una figura que nunca existió.
//
// Los toques se guardan en PÍXELES DEL FOTOGRAMA, no de pantalla. El método supone el punto
// principal en el centro de la imagen, así que mezclar unas coordenadas con un centro de otras
// desplaza el cálculo — y el error no se ve, solo sale una proporción algo torcida. Como el marco
// lleva la proporción exacta del fotograma, la conversión es una regla de tres y el dibujo se
// coloca en porcentajes, que además aguanta que el diálogo cambie de tamaño.
//
// Los puntos se unen según se tocan, y el cuarto cierra el polígono — como en la app de medición.

"use client";

import type { Point2d } from "@/features/room-editor/schemas/room-document";

export const CORNERS_NEEDED = 4;

export function FloorCaptureStage({
  imageUrl,
  frameWidthPx,
  frameHeightPx,
  points,
  onAddPoint,
}: {
  imageUrl: string;
  frameWidthPx: number;
  frameHeightPx: number;
  /** En píxeles del fotograma. */
  points: Point2d[];
  onAddPoint: (point: Point2d) => void;
}) {
  const complete = points.length >= CORNERS_NEEDED;

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (complete) return;

    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    onAddPoint([
      ((event.clientX - rect.left) / rect.width) * frameWidthPx,
      ((event.clientY - rect.top) / rect.height) * frameHeightPx,
    ]);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{ aspectRatio: frameWidthPx / frameHeightPx }}
      className="relative w-full overflow-hidden rounded-md border bg-black"
      aria-label={
        complete
          ? "Las cuatro esquinas están puestas"
          : `Toca la esquina ${points.length + 1} de ${CORNERS_NEEDED}`
      }
    >
      {/* Sin next/image: es un fotograma en memoria (blob), no un recurso que se pueda optimizar. */}
      {/** biome-ignore lint/performance/noImgElement: fotograma local, no un asset */}
      <img
        src={imageUrl}
        alt=""
        className="pointer-events-none size-full object-contain"
      />

      <svg
        className="pointer-events-none absolute inset-0 size-full"
        viewBox={`0 0 ${frameWidthPx} ${frameHeightPx}`}
        role="img"
      >
        <title>Contorno del piso marcado</title>
        {points.map((point, index) => {
          const next = points[index + 1] ?? (complete ? points[0] : null);
          if (!next) return null;

          return (
            <line
              key={`${point[0]}-${point[1]}-line`}
              x1={point[0]}
              y1={point[1]}
              x2={next[0]}
              y2={next[1]}
              stroke="rgb(245 158 11)"
              strokeWidth={frameWidthPx / 200}
            />
          );
        })}
      </svg>

      <div className="pointer-events-none absolute inset-0">
        {points.map((point, index) => (
          <span
            key={`${point[0]}-${point[1]}-dot`}
            style={{
              left: `${(point[0] / frameWidthPx) * 100}%`,
              top: `${(point[1] / frameHeightPx) * 100}%`,
            }}
            className="absolute flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-amber-950"
          >
            {index + 1}
          </span>
        ))}
      </div>
    </button>
  );
}
