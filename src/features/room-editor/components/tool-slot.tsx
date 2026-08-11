// src/features/room-editor/components/tool-slot.tsx — una ranura de la tira lateral: el botón de la
// herramienta visible y, si su grupo tiene variantes, el triángulo que abre el flyout.
//
// Reparto de clics igual que en Photoshop: el botón grande ACTIVA (sin abrir nada) y solo el
// triangulito de la esquina abre la lista. Es un blanco pequeño a propósito — fallar y darle al
// botón grande activa la herramienta que ya se veía, que es inofensivo; al revés (abrir el menú
// cada vez que se quiere dibujar) sería un clic de más en el gesto más frecuente del editor.

"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TOOL_ICONS } from "@/features/room-editor/components/tool-icons";
import {
  ROOM_TOOLS,
  type RoomToolGroup,
} from "@/features/room-editor/tools/tool-registry";
import type { RoomToolKind } from "@/features/room-editor/tools/tool-types";
import { cn } from "@/lib/utils";

export function ToolSlot({
  group,
  shownTool,
  isActive,
  onSelect,
}: {
  group: RoomToolGroup;
  shownTool: RoomToolKind;
  isActive: boolean;
  onSelect: (kind: RoomToolKind) => void;
}) {
  const Icon = TOOL_ICONS[shownTool];

  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label={ROOM_TOOLS[shownTool].label}
              aria-pressed={isActive}
              onClick={() => onSelect(shownTool)}
              className={cn(
                "flex size-10 items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="size-4" />
            </button>
          }
        />
        <TooltipContent side="right">
          {ROOM_TOOLS[shownTool].label}
        </TooltipContent>
      </Tooltip>

      {group.tools.length > 1 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label={`Variantes de ${group.label}`}
                className={cn(
                  "absolute right-0 bottom-0 size-3.5 rounded-br-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  // El triángulo son dos bordes de una caja de 0×0, no un glifo: así hereda el
                  // color del texto del botón y no depende de que una fuente traiga ese carácter.
                  "after:absolute after:right-[3px] after:bottom-[3px] after:border-[3px] after:border-transparent after:border-r-current after:border-b-current after:content-['']",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground",
                )}
              />
            }
          />
          <DropdownMenuContent side="right" align="start" className="w-auto">
            {/* El Group no es decorativo: DropdownMenuLabel es un Menu.GroupLabel de Base UI y
                revienta en runtime si no encuentra un Menu.Group por encima. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              {group.tools.map((kind) => {
                const VariantIcon = TOOL_ICONS[kind];
                return (
                  <DropdownMenuItem key={kind} onClick={() => onSelect(kind)}>
                    <VariantIcon className="size-4" />
                    {ROOM_TOOLS[kind].label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
