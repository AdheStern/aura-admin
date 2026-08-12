// src/features/room-editor/components/room-toolbar.tsx — la barra de acciones sobre el DOCUMENTO:
// deshacer/rehacer con la etiqueta de la Tarea 1 ("Deshacer: mover pilar"), zoom e import/export.
// Las herramientas de dibujo NO están aquí — viven en la tira lateral (tool-sidebar.tsx), separadas
// a propósito: elegir con qué dibujar y actuar sobre el documento entero son dos gestos distintos y
// mezclarlos en una fila era justo lo que hacía la barra ilegible. Mismo reparto que
// flow-toolbar.tsx: acciones a la izquierda, estado de guardado y de escena a la derecha.

"use client";

import {
  MinusIcon,
  PlusIcon,
  RedoIcon,
  RotateCcwIcon,
  UndoIcon,
} from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Room3dEditorLink } from "@/features/room-3d/components/room-3d-editor-link";
import { ImportExportControls } from "@/features/room-editor/components/import-export-controls";
import { SaveStatusLabel } from "@/features/room-editor/components/save-status-label";
import {
  redoLabel,
  undoLabel,
} from "@/features/room-editor/history/room-history";
import {
  DEFAULT_CANVAS_VIEWPORT,
  zoomAtPoint,
} from "@/features/room-editor/model/canvas-transform";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";
import { SceneEditorHeader } from "@/features/scenes/components/scene-editor-header";
import { SceneStatusBadge } from "@/features/scenes/components/scene-status-badge";

const ZOOM_BUTTON_STEP = 1.25;

export function RoomToolbar({ sceneName }: { sceneName: string }) {
  const params = useParams<{ projectId: string; sceneId: string }>();
  const canManage = useRoomStore((state) => state.canManage);
  const history = useRoomStore((state) => state.history);
  const undo = useRoomStore((state) => state.undo);
  const redo = useRoomStore((state) => state.redo);
  const viewport = useRoomStore((state) => state.canvasViewport);
  const setCanvasViewport = useRoomStore((state) => state.setCanvasViewport);
  const sceneStatus = useRoomStore((state) => state.sceneStatus);
  const saveStatus = useRoomStore((state) => state.saveStatus);

  function zoomBy(factor: number) {
    const anchor = { x: viewport.originXPx, y: viewport.originYPx };
    setCanvasViewport(zoomAtPoint(viewport, anchor, viewport.scale * factor));
  }

  return (
    <>
      <SceneEditorHeader sceneName={sceneName}>
        <SaveStatusLabel status={saveStatus} />
        <SceneStatusBadge status={sceneStatus} />
        <Room3dEditorLink
          projectId={params.projectId}
          sceneId={params.sceneId}
          enabled={sceneStatus === "ROOM_READY"}
        />
      </SceneEditorHeader>

      {/* Acciones sobre el DOCUMENTO, no sobre la escena: deshacer, zoom e import/export. Las de la
          escena —estado y salto al 3D— viven arriba, en la franja de título. */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-background px-4 py-2">
        {canManage ? (
          <>
            <Button
              variant="outline"
              size="icon-sm"
              title={
                undoLabel(history)
                  ? `Deshacer: ${undoLabel(history)}`
                  : "Deshacer"
              }
              disabled={history.past.length === 0}
              onClick={undo}
            >
              <UndoIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              title={
                redoLabel(history)
                  ? `Rehacer: ${redoLabel(history)}`
                  : "Rehacer"
              }
              disabled={history.future.length === 0}
              onClick={redo}
            >
              <RedoIcon />
            </Button>
            <Separator orientation="vertical" className="h-6" />
          </>
        ) : null}

        <Button
          variant="outline"
          size="icon-sm"
          title="Alejar"
          onClick={() => zoomBy(1 / ZOOM_BUTTON_STEP)}
        >
          <MinusIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          title="Acercar"
          onClick={() => zoomBy(ZOOM_BUTTON_STEP)}
        >
          <PlusIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          title="Restablecer vista"
          onClick={() => setCanvasViewport(DEFAULT_CANVAS_VIEWPORT)}
        >
          <RotateCcwIcon />
        </Button>

        <Separator orientation="vertical" className="h-6" />
        <ImportExportControls />
      </div>
    </>
  );
}
