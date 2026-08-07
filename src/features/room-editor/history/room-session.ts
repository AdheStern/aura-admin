// src/features/room-editor/history/room-session.ts — documento + historial como una sola cosa.
// Es la costura que el store Zustand del editor (tarea 2) envuelve: toda la lógica de qué pasa al
// ejecutar, deshacer y rehacer vive aquí, en funciones puras, y el store solo guarda el resultado.

import {
  applyRoomCommand,
  roomCommandCoalesceKey,
  roomCommandLabel,
} from "@/features/room-editor/history/apply-room-command";
import {
  EMPTY_ROOM_HISTORY,
  pushHistoryEntry,
  type RoomHistory,
  redoEntry,
  undoEntry,
} from "@/features/room-editor/history/room-history";
import type { RoomCommand } from "@/features/room-editor/schemas/room-command";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";

export type RoomSession = {
  document: RoomDocument;
  history: RoomHistory;
};

export function startRoomSession(document: RoomDocument): RoomSession {
  return { document, history: EMPTY_ROOM_HISTORY };
}

/** `nowMs` entra por parámetro (no Date.now() aquí dentro) para que la fusión sea testeable. */
export function runRoomCommand(
  session: RoomSession,
  command: RoomCommand,
  nowMs: number,
): RoomSession {
  const result = applyRoomCommand(session.document, command);
  if (!result) return session;

  return {
    document: result.next,
    history: pushHistoryEntry(session.history, {
      command,
      inverse: result.inverse,
      label: roomCommandLabel(command),
      coalesceKey: roomCommandCoalesceKey(command),
      atMs: nowMs,
    }),
  };
}

export function undoRoomCommand(session: RoomSession): RoomSession {
  const undone = undoEntry(session.history);
  if (!undone) return session;

  return {
    document: applyDirect(session.document, undone.entry.inverse),
    history: undone.history,
  };
}

export function redoRoomCommand(session: RoomSession): RoomSession {
  const redone = redoEntry(session.history);
  if (!redone) return session;

  return {
    document: applyDirect(session.document, redone.entry.command),
    history: redone.history,
  };
}

// Deshacer y rehacer no apilan: el inverso ya está guardado en la entrada, así que reejecutarlo no
// necesita recalcular nada. Si devolviera null el documento se queda como está — solo puede pasar
// si el comando y su inverso dejaron de corresponderse, que sería un bug de un handler.
function applyDirect(
  document: RoomDocument,
  command: RoomCommand,
): RoomDocument {
  return applyRoomCommand(document, command)?.next ?? document;
}
