// src/features/room-editor/components/floor-capture-dialog.tsx — medir el piso con la cámara.
//
// Se limita a RECTÁNGULOS a propósito. Con cuatro esquinas de un rectángulo la proporción tiene
// solución cerrada (model/rectangle-from-photo.ts); con una planta en L habría que resolver también
// qué esquina es cóncava y la foto ya no basta. Un rectángulo aproximado que luego se corrige a mano
// es un punto de partida útil; una planta compleja mal medida es trabajo de más.
//
// Los metros los pone el USUARIO. Sin LiDAR, de una foto no sale ninguna escala: la misma imagen la
// produce una sala pequeña de cerca y una grande de lejos. Una medida real de un lado —una cinta, o
// contar baldosas— basta para fijar las dos, porque la proporción ya se sabe.
//
// La cámara exige contexto seguro (HTTPS o localhost) y un gesto del usuario, y en iOS el vídeo
// tiene que ir con `playsInline` o Safari lo abre a pantalla completa y se lleva el diálogo por
// delante.

"use client";

import { CameraIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FloorCaptureScale } from "@/features/room-editor/components/floor-capture-scale";
import {
  CORNERS_NEEDED,
  FloorCaptureStage,
} from "@/features/room-editor/components/floor-capture-stage";
import type { Point2d } from "@/features/room-editor/schemas/room-document";

type Shot = { url: string; width: number; height: number };

export function FloorCaptureDialog({
  onFootprint,
}: {
  onFootprint: (widthM: number, depthM: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [shot, setShot] = useState<Shot | null>(null);
  const [points, setPoints] = useState<Point2d[]>([]);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function stopCamera() {
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
  }

  function reset() {
    stopCamera();
    if (shot) URL.revokeObjectURL(shot.url);
    setShot(null);
    setPoints([]);
    setError(null);
  }

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError(
        "No se pudo abrir la cámara. Hace falta permiso y una conexión segura (https).",
      );
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;

    const canvas = window.document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      stopCamera();
      setShot({
        url: URL.createObjectURL(blob),
        width: canvas.width,
        height: canvas.height,
      });
    }, "image/jpeg");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            title="Medir el piso con la cámara"
            onClick={startCamera}
          >
            <CameraIcon />
          </Button>
        }
      />

      <DialogContent className="max-w-xl">
        <DialogTitle>Medir el piso con la cámara</DialogTitle>
        <DialogDescription>
          Encuadra el piso entero, captura y toca sus cuatro esquinas. Es una
          estimación: sirve para partir de una planta parecida, no para un plano
          de obra.
        </DialogDescription>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {shot ? (
          <FloorCaptureStage
            imageUrl={shot.url}
            frameWidthPx={shot.width}
            frameHeightPx={shot.height}
            points={points}
            onAddPoint={(point) => setPoints((all) => [...all, point])}
          />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full rounded-md border bg-black"
          />
        )}

        {shot ? (
          <FloorCaptureScale
            points={points}
            imageWidthPx={shot.width}
            imageHeightPx={shot.height}
            onRetake={() => {
              reset();
              void startCamera();
            }}
            onUndoPoint={() => setPoints((all) => all.slice(0, -1))}
            onConfirm={(widthM, depthM) => {
              onFootprint(widthM, depthM);
              handleOpenChange(false);
            }}
          />
        ) : (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              onClick={capture}
              disabled={!!error}
            >
              Capturar
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Toca las esquinas en orden, dando la vuelta al piso. Necesita{" "}
          {CORNERS_NEEDED}.
        </p>
      </DialogContent>
    </Dialog>
  );
}
