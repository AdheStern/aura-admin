// src/features/room-editor/components/room-canvas.tsx — el lienzo Konva: Stage + capas +
// despacho de puntero a la herramienta activa. TRAMPA (§9.5): Konva reporta píxeles de pantalla;
// la conversión a metros ocurre SOLO aquí, en modelPointFromEvent, ya con snap — todo lo que hay
// debajo (tools/, model/) recibe siempre metros ya enganchados a un punto existente o a la rejilla.
//
// El snap a un punto existente (esquina, pilar, zona) gana sobre el snap a la rejilla numérica: es
// una señal más específica de la intención del usuario que "redondear al 0.1 más cercano" — ver
// snap-points.ts. polyline-tool.ts vuelve a consultarlo para decidir si el snap ortogonal debe
// ceder el paso.
//
// El fondo (<RoomGrid>) no escucha eventos (listening=false): el Stage entero hace de "pane" vacío,
// y por eso el mousedown/click en cualquier punto sin figura debajo llega con
// `event.target === stage`, la comprobación que separa "clic en el vacío" de "clic burbujeado desde
// una figura ya existente" (Konva sí hace bubbling de eventos de puntero hasta el Stage, a
// diferencia de React).

"use client";

import type Konva from "konva";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { Layer, Stage } from "react-konva";
import { DraftLayer } from "@/features/room-editor/components/draft-layer";
import { FootprintLayer } from "@/features/room-editor/components/footprint-layer";
import { ObstacleLayer } from "@/features/room-editor/components/obstacle-layer";
import { OpeningLayer } from "@/features/room-editor/components/opening-layer";
import { RoomGrid } from "@/features/room-editor/components/room-grid";
import { ZoneLayer } from "@/features/room-editor/components/zone-layer";
import { useElementSize } from "@/features/room-editor/hooks/use-element-size";
import { canvasPalette } from "@/features/room-editor/model/canvas-palette";
import {
  toModelPointM,
  zoomAtPoint,
} from "@/features/room-editor/model/canvas-transform";
import { snapPointToGridM } from "@/features/room-editor/model/geometry-2d";
import { nearestExistingPointM } from "@/features/room-editor/model/snap-points";
import type { Point2d } from "@/features/room-editor/schemas/room-document";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";
import { ROOM_TOOLS } from "@/features/room-editor/tools/tool-registry";

const ZOOM_STEP_IN = 1.08;
const ZOOM_STEP_OUT = 1 / ZOOM_STEP_IN;

/** El lienzo es un <canvas>, nunca el foco del teclado: si hay un elemento editable enfocado, la
 *  tecla es suya y no un atajo del editor. Incluye contentEditable por el combobox de materiales,
 *  que no siempre expone un <input> nativo. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

export function RoomCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { widthPx, heightPx } = useElementSize(containerRef);
  const { resolvedTheme } = useTheme();
  const palette = canvasPalette(resolvedTheme === "dark" ? "dark" : "light");

  const document = useRoomStore((state) => state.document);
  const viewport = useRoomStore((state) => state.canvasViewport);
  const setCanvasViewport = useRoomStore((state) => state.setCanvasViewport);
  const activeTool = useRoomStore((state) => state.activeTool);
  const canManage = useRoomStore((state) => state.canManage);
  const handlePointerDown = useRoomStore((state) => state.handlePointerDown);
  const handlePointerMove = useRoomStore((state) => state.handlePointerMove);
  const handlePointerUp = useRoomStore((state) => state.handlePointerUp);
  const handleEnterKey = useRoomStore((state) => state.handleEnterKey);
  const handleEscapeKey = useRoomStore((state) => state.handleEscapeKey);
  const deleteSelection = useRoomStore((state) => state.deleteSelection);
  const select = useRoomStore((state) => state.select);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // El listener está en `window`, así que también oye lo que se teclea en el panel de
      // propiedades: sin este corte, Retroceso corrigiendo un número en "Altura (m)" o filtrando en
      // el buscador de materiales borraría la figura seleccionada.
      if (isTypingTarget(event.target)) return;

      if (event.key === "Enter") handleEnterKey();
      if (event.key === "Escape") handleEscapeKey();
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelection();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleEnterKey, handleEscapeKey, deleteSelection]);

  function modelPointFromEvent(
    event: Konva.KonvaEventObject<MouseEvent>,
  ): Point2d | null {
    if (event.target !== event.target.getStage()) return null;
    // getRelativePointerPosition (no getPointerPosition): ya neta del paneo del Stage — ver la
    // nota de canvas-transform.ts.
    const pointerPx = event.target.getStage()?.getRelativePointerPosition();
    if (!pointerPx) return null;

    const rawM = toModelPointM(pointerPx, viewport);
    return nearestExistingPointM(rawM, document) ?? snapPointToGridM(rawM);
  }

  function handleWheel(event: Konva.KonvaEventObject<WheelEvent>) {
    event.evt.preventDefault();
    const pointerPx = event.target.getStage()?.getPointerPosition();
    if (!pointerPx) return;
    const factor = event.evt.deltaY > 0 ? ZOOM_STEP_OUT : ZOOM_STEP_IN;
    setCanvasViewport(
      zoomAtPoint(viewport, pointerPx, viewport.scale * factor),
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative min-w-0 flex-1 overflow-hidden bg-background"
      style={{ cursor: ROOM_TOOLS[activeTool].cursor }}
    >
      {widthPx > 0 && heightPx > 0 ? (
        <Stage
          width={widthPx}
          height={heightPx}
          x={viewport.originXPx}
          y={viewport.originYPx}
          draggable={activeTool === "select" && canManage}
          onDragEnd={(event) =>
            setCanvasViewport({
              ...viewport,
              originXPx: event.target.x(),
              originYPx: event.target.y(),
            })
          }
          onWheel={handleWheel}
          onMouseDown={(event) => {
            if (!canManage) return;
            const pointM = modelPointFromEvent(event);
            if (pointM) handlePointerDown(pointM);
          }}
          onMouseMove={(event) => {
            if (!canManage) return;
            const pointM = modelPointFromEvent(event);
            if (pointM) handlePointerMove(pointM);
          }}
          onMouseUp={(event) => {
            if (!canManage) return;
            const pointM = modelPointFromEvent(event);
            if (pointM) handlePointerUp(pointM);
          }}
          onClick={(event) => {
            if (
              activeTool === "select" &&
              event.target === event.target.getStage()
            ) {
              select(null);
            }
          }}
        >
          <Layer>
            <RoomGrid
              viewport={viewport}
              widthPx={widthPx}
              heightPx={heightPx}
              palette={palette}
            />
          </Layer>
          <Layer>
            <FootprintLayer palette={palette} />
            <ZoneLayer palette={palette} />
            <ObstacleLayer palette={palette} />
            <OpeningLayer palette={palette} />
            <DraftLayer palette={palette} />
          </Layer>
        </Stage>
      ) : null}
    </div>
  );
}
