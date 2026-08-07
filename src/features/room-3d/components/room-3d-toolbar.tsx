// src/features/room-3d/components/room-3d-toolbar.tsx — deshacer/rehacer e import/export operan
// sobre el MISMO documento que el editor 2D (mismo store, mismo historial), así que se muestran
// igual aquí. No hay zoom: eso lo resuelve OrbitControls sobre el propio lienzo 3D.

"use client";

import { RedoIcon, UndoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ImportExportControls } from "@/features/room-editor/components/import-export-controls";
import { SaveStatusLabel } from "@/features/room-editor/components/save-status-label";
import {
  redoLabel,
  undoLabel,
} from "@/features/room-editor/history/room-history";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";
import { SceneStatusBadge } from "@/features/scenes/components/scene-status-badge";

export function Room3dToolbar() {
  const canManage = useRoomStore((state) => state.canManage);
  const history = useRoomStore((state) => state.history);
  const undo = useRoomStore((state) => state.undo);
  const redo = useRoomStore((state) => state.redo);
  const sceneStatus = useRoomStore((state) => state.sceneStatus);
  const saveStatus = useRoomStore((state) => state.saveStatus);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-background p-2">
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
              redoLabel(history) ? `Rehacer: ${redoLabel(history)}` : "Rehacer"
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

      <div className="ml-auto flex items-center gap-3">
        <SaveStatusLabel status={saveStatus} />
        <SceneStatusBadge status={sceneStatus} />
      </div>
    </div>
  );
}
