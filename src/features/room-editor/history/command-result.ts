// src/features/room-editor/history/command-result.ts — el contrato que cumple todo comando.
//
// `null` significa "esto no cambia nada" y no es un error: el historial simplemente no apila la
// entrada. Cubre los dos casos reales —un gesto que suelta el vértice donde estaba y un comando que
// nombra un id que ya no existe— sin obligar a cada herramienta a comprobarlo antes de emitir.
//
// El inverso se calcula contra el estado PREVIO y viaja con la entrada del historial, así que
// deshacer no vuelve a razonar sobre el documento: aplica un comando ya construido.

import type {
  RoomCommand,
  RoomCommandKind,
  RoomCommandOf,
} from "@/features/room-editor/schemas/room-command";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";

export type RoomCommandResult = {
  next: RoomDocument;
  inverse: RoomCommand;
} | null;

export type RoomCommandHandler<K extends RoomCommandKind> = (
  document: RoomDocument,
  command: RoomCommandOf<K>,
) => RoomCommandResult;
