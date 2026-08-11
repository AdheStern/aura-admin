// src/features/room-editor/history/apply-room-command.ts — despachador único de comandos.
// Es la única puerta de entrada a una mutación del documento: fuera de aquí nadie construye un
// RoomDocument nuevo a mano, porque entonces esa mutación no tendría inverso y rompería el historial.

import { ROOM_COMMANDS } from "@/features/room-editor/history/command-registry";
import type {
  RoomCommandHandler,
  RoomCommandResult,
} from "@/features/room-editor/history/command-result";
import type {
  RoomCommand,
  RoomCommandKind,
} from "@/features/room-editor/schemas/room-command";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";

// El registro correlaciona kind↔handler por construcción (es un tipo mapeado sobre RoomCommandKind),
// pero TS no estrecha los dos lados de un acceso indexado a la vez y ve el handler como el de la
// unión entera. El cast es seguro justo por esa correlación; escribir diecisiete ramas idénticas
// para convencerlo no lo haría más cierto.
type AnyHandler = RoomCommandHandler<RoomCommandKind>;
type AnyCoalesceKey = (command: RoomCommand) => string;

export function applyRoomCommand(
  document: RoomDocument,
  command: RoomCommand,
): RoomCommandResult {
  const apply = ROOM_COMMANDS[command.kind].apply as AnyHandler;
  return apply(document, command);
}

export function roomCommandLabel(command: RoomCommand): string {
  return ROOM_COMMANDS[command.kind].label;
}

/** null = no se funde nunca con la entrada anterior del historial. */
export function roomCommandCoalesceKey(command: RoomCommand): string | null {
  const coalesceKey = ROOM_COMMANDS[command.kind].coalesceKey as
    | AnyCoalesceKey
    | undefined;
  return coalesceKey ? coalesceKey(command) : null;
}
