// src/features/room-editor/components/tool-sidebar.tsx — la tira de herramientas, pegada al borde
// izquierdo del editor. Una ranura por familia (TOOL_GROUPS), no un botón por herramienta: con
// flyouts la columna se queda estrecha aunque el registro crezca.
//
// Oculta entera para quien solo puede ver: el lienzo ya ignora el puntero sin canManage
// (room-canvas.tsx), así que una tira de herramientas que no hacen nada sería peor que ninguna.

"use client";

import { useState } from "react";
import { ToolSlot } from "@/features/room-editor/components/tool-slot";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";
import { TOOL_GROUPS } from "@/features/room-editor/tools/tool-registry";
import type { RoomToolKind } from "@/features/room-editor/tools/tool-types";

export function ToolSidebar() {
  const canManage = useRoomStore((state) => state.canManage);
  const activeTool = useRoomStore((state) => state.activeTool);
  const setActiveTool = useRoomStore((state) => state.setActiveTool);
  const [lastUsed, setLastUsed] = useState<Record<string, RoomToolKind>>(() =>
    Object.fromEntries(TOOL_GROUPS.map((group) => [group.id, group.tools[0]])),
  );

  if (!canManage) return null;

  return (
    <aside className="flex w-14 shrink-0 flex-col items-center gap-1 border-r bg-background p-2">
      {TOOL_GROUPS.map((group) => {
        const isActive = group.tools.includes(activeTool);
        return (
          <div key={group.id} className="contents">
            <ToolSlot
              group={group}
              // Si la herramienta activa es de este grupo, el icono es ESA aunque el flyout se
              // usara por última vez con otra: deriva del store en vez de sincronizarlo con un
              // efecto, así un cambio de herramienta desde fuera de la tira no la deja mintiendo.
              shownTool={
                isActive ? activeTool : (lastUsed[group.id] ?? group.tools[0])
              }
              isActive={isActive}
              onSelect={(kind) => {
                setLastUsed((current) => ({ ...current, [group.id]: kind }));
                setActiveTool(kind);
              }}
            />
            {group.dividerAfter ? (
              <div className="my-1 h-px w-6 shrink-0 bg-border" />
            ) : null}
          </div>
        );
      })}
    </aside>
  );
}
