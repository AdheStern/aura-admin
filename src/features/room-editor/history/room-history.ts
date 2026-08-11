// src/features/room-editor/history/room-history.ts — las dos pilas del deshacer/rehacer.
// Puro y sin documento: aquí solo viven los comandos. El estado presente lo tiene el store del
// editor (Fase 3, tarea 2), que compone las dos cosas con room-session.ts.

import type { RoomCommand } from "@/features/room-editor/schemas/room-command";

export type RoomHistoryEntry = {
  command: RoomCommand;
  inverse: RoomCommand;
  label: string;
  coalesceKey: string | null;
  atMs: number;
};

export type RoomHistory = {
  past: RoomHistoryEntry[];
  future: RoomHistoryEntry[];
};

export const EMPTY_ROOM_HISTORY: RoomHistory = { past: [], future: [] };

/** Una sesión larga de CAD no cabe entera en memoria del navegador y nadie deshace cien pasos. */
const MAX_HISTORY_ENTRIES = 100;

// Ventana de fusión. Un arrastre emite un comando por frame (~16 ms) y teclear en un campo numérico
// separa las pulsaciones por décimas; dos ediciones deliberadas del mismo objetivo siempre distan
// más que esto. Se compara contra el reloj que pasa el llamador para que el módulo siga siendo puro.
const COALESCE_WINDOW_MS = 600;

export function pushHistoryEntry(
  history: RoomHistory,
  entry: RoomHistoryEntry,
): RoomHistory {
  const past = canCoalesce(history, entry)
    ? [...history.past.slice(0, -1), merge(lastOf(history.past), entry)]
    : [...history.past, entry];

  // Rehacer deja de tener sentido en cuanto la línea temporal se bifurca.
  return { past: past.slice(-MAX_HISTORY_ENTRIES), future: [] };
}

export function undoEntry(
  history: RoomHistory,
): { history: RoomHistory; entry: RoomHistoryEntry } | null {
  const entry = lastOf(history.past);
  if (!entry) return null;

  return {
    history: {
      past: history.past.slice(0, -1),
      future: [entry, ...history.future],
    },
    entry,
  };
}

export function redoEntry(
  history: RoomHistory,
): { history: RoomHistory; entry: RoomHistoryEntry } | null {
  const [entry, ...rest] = history.future;
  if (!entry) return null;

  return { history: { past: [...history.past, entry], future: rest }, entry };
}

export function undoLabel(history: RoomHistory): string | null {
  return lastOf(history.past)?.label ?? null;
}

export function redoLabel(history: RoomHistory): string | null {
  return history.future[0]?.label ?? null;
}

function canCoalesce(history: RoomHistory, entry: RoomHistoryEntry): boolean {
  const previous = lastOf(history.past);
  return (
    entry.coalesceKey !== null &&
    previous?.coalesceKey === entry.coalesceKey &&
    entry.atMs - previous.atMs <= COALESCE_WINDOW_MS
  );
}

/** El comando más nuevo hacia delante y el inverso más viejo hacia atrás: el gesto entero. */
function merge(
  previous: RoomHistoryEntry | undefined,
  entry: RoomHistoryEntry,
): RoomHistoryEntry {
  return previous ? { ...entry, inverse: previous.inverse } : entry;
}

function lastOf(entries: RoomHistoryEntry[]): RoomHistoryEntry | undefined {
  return entries[entries.length - 1];
}
