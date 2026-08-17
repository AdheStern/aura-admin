// src/features/room-3d/components/room-3d-toolbar.tsx — deshacer/rehacer e import/export operan
// sobre el MISMO documento que el editor 2D (mismo store, mismo historial), así que se muestran
// igual aquí. No hay zoom: eso lo resuelve OrbitControls sobre el propio lienzo 3D.

"use client";

import { RedoIcon, ThermometerIcon, UndoIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ImportExportControls } from "@/features/room-editor/components/import-export-controls";
import { SaveStatusLabel } from "@/features/room-editor/components/save-status-label";
import {
  redoLabel,
  undoLabel,
} from "@/features/room-editor/history/room-history";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";
import { SceneEditorHeader } from "@/features/scenes/components/scene-editor-header";
import { SceneStatusBadge } from "@/features/scenes/components/scene-status-badge";

export function Room3dToolbar({
  sceneName,
  hasOverlay,
  showMap,
  onToggleMap,
}: {
  sceneName: string;
  hasOverlay: boolean;
  showMap: boolean;
  onToggleMap: () => void;
}) {
  const params = useParams<{ projectId: string; sceneId: string }>();
  const canManage = useRoomStore((state) => state.canManage);
  const history = useRoomStore((state) => state.history);
  const undo = useRoomStore((state) => state.undo);
  const redo = useRoomStore((state) => state.redo);
  const sceneStatus = useRoomStore((state) => state.sceneStatus);
  const saveStatus = useRoomStore((state) => state.saveStatus);

  return (
    <>
      <SceneEditorHeader sceneName={sceneName}>
        <SaveStatusLabel status={saveStatus} />
        <SceneStatusBadge status={sceneStatus} />
        {/* Espejo del "Generar 3D" del editor 2D. Las migas de la cabecera llevan al mismo sitio,
            pero ir y volver entre planta y volumen es un gesto del trabajo, no navegacion. */}
        <Link
          href={`/projects/${params.projectId}/scenes/${params.sceneId}/room`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          &larr; Editor 2D
        </Link>
      </SceneEditorHeader>

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

        <ImportExportControls />

        {/* Solo cuando hay algo que enseñar: un interruptor que no enciende nada haría pensar que el
          mapa está roto en vez de que la escena aún no se ha simulado. */}
        {hasOverlay ? (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant={showMap ? "secondary" : "outline"}
              size="sm"
              aria-pressed={showMap}
              onClick={onToggleMap}
            >
              <ThermometerIcon />
              Cobertura
            </Button>
          </>
        ) : null}
      </div>
    </>
  );
}
