// src/features/room-editor/components/floor-capture-scale.tsx — de la proporción a los metros.
//
// La foto da la PROPORCIÓN; los metros los pone el usuario midiendo un lado. De ahí que el campo
// que se pide sea uno solo: el otro sale de la proporción, y ofrecer los dos invitaría a teclear una
// pareja que no cuadra con lo que se acaba de fotografiar.
//
// El fondo calculado se deja EDITABLE de todas formas. La estimación es aproximada por definición, y
// quien tiene la cinta en la mano sabe más que el método: bloquearlo obligaría a importar un número
// que ya se sabe que está mal y corregirlo después en el editor.

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CORNERS_NEEDED } from "@/features/room-editor/components/floor-capture-stage";
import { estimateAspectRatio } from "@/features/room-editor/model/rectangle-from-photo";
import type { Point2d } from "@/features/room-editor/schemas/room-document";

export function FloorCaptureScale({
  points,
  imageWidthPx,
  imageHeightPx,
  onRetake,
  onUndoPoint,
  onConfirm,
}: {
  points: Point2d[];
  imageWidthPx: number;
  imageHeightPx: number;
  onRetake: () => void;
  onUndoPoint: () => void;
  onConfirm: (widthM: number, depthM: number) => void;
}) {
  const [widthM, setWidthM] = useState("");
  const [depthOverride, setDepthOverride] = useState<string | null>(null);

  const ready = points.length === CORNERS_NEEDED;
  const estimate = ready
    ? estimateAspectRatio(points, imageWidthPx, imageHeightPx)
    : null;

  const width = Number(widthM);
  const derivedDepth =
    estimate && width > 0 ? width / estimate.widthOverDepth : null;
  const depth =
    depthOverride !== null ? Number(depthOverride) : (derivedDepth ?? 0);
  const usable = width > 0 && depth > 0;

  return (
    <div className="flex flex-col gap-3">
      {!ready ? (
        <p className="text-sm text-muted-foreground">
          Faltan {CORNERS_NEEDED - points.length} esquinas.
        </p>
      ) : null}

      {ready && !estimate ? (
        <p className="text-sm text-destructive">
          Esas cuatro esquinas no forman un rectángulo reconocible. Vuelve a
          tomar la foto.
        </p>
      ) : null}

      {estimate?.assumedFocal ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          La foto es demasiado frontal para deducir el objetivo, así que se
          supuso el de un móvil corriente. Repetirla desde una esquina de la
          sala afina la proporción.
        </p>
      ) : null}

      {estimate ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="capture-width">Lado 1→2 medido (m)</Label>
            <Input
              id="capture-width"
              type="number"
              inputMode="decimal"
              min={0.5}
              step={0.1}
              value={widthM}
              onChange={(event) => setWidthM(event.target.value)}
              placeholder="p. ej. 8.4"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="capture-depth">Lado 1→4 estimado (m)</Label>
            <Input
              id="capture-depth"
              type="number"
              inputMode="decimal"
              min={0.5}
              step={0.1}
              value={
                depthOverride ?? (derivedDepth ? derivedDepth.toFixed(2) : "")
              }
              onChange={(event) => setDepthOverride(event.target.value)}
              placeholder="se calcula solo"
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onRetake}>
          Repetir foto
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onUndoPoint}
          disabled={points.length === 0}
        >
          Quitar última esquina
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!usable}
          onClick={() =>
            onConfirm(Number(width.toFixed(2)), Number(depth.toFixed(2)))
          }
        >
          Usar esta planta
        </Button>
      </div>
    </div>
  );
}
