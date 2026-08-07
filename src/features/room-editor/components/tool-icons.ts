// src/features/room-editor/components/tool-icons.ts — el icono de cada herramienta del registro.
//
// Vive en components/ y no junto a ROOM_TOOLS a propósito: tools/ es deliberadamente código sin
// React (ver la cabecera de tool-types.ts) para poder testear las herramientas sin montar nada, y
// un icono de lucide es un componente React. El registro dice QUÉ hace cada herramienta; esto, cómo
// se ve.

import {
  AppWindowIcon,
  CircleIcon,
  DoorOpenIcon,
  EraserIcon,
  type LucideIcon,
  MousePointer2Icon,
  PenToolIcon,
  RectangleHorizontalIcon,
  RulerIcon,
  SquareIcon,
  TheaterIcon,
  UsersIcon,
} from "lucide-react";
import type { RoomToolKind } from "@/features/room-editor/tools/tool-types";

export const TOOL_ICONS: Record<RoomToolKind, LucideIcon> = {
  select: MousePointer2Icon,
  erase: EraserIcon,
  wall: PenToolIcon,
  rect: RectangleHorizontalIcon,
  pillarRect: SquareIcon,
  pillarCircle: CircleIcon,
  window: AppWindowIcon,
  door: DoorOpenIcon,
  stageZone: TheaterIcon,
  audienceZone: UsersIcon,
  measure: RulerIcon,
};
