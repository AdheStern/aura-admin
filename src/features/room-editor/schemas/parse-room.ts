// src/features/room-editor/schemas/parse-room.ts — lectura de la columna Scene.room.
// Mismo trato que parseSignalFlow: Prisma crea la columna con `{}` por @default, que no es un
// documento corrupto sino una escena recién creada, y se traduce al documento vacío.

import {
  EMPTY_ROOM,
  type RoomDocument,
  roomDocumentSchema,
} from "@/features/room-editor/schemas/room-document";

export type ParseRoomResult =
  | { ok: true; data: RoomDocument }
  | { ok: false; message: string };

export function parseRoom(raw: unknown): ParseRoomResult {
  if (isEmptyJsonObject(raw)) return { ok: true, data: EMPTY_ROOM };

  const parsed = roomDocumentSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join(".");
    return {
      ok: false,
      message: path
        ? `${path}: ${issue.message}`
        : (issue?.message ?? "Geometría del recinto inválida"),
    };
  }
  return { ok: true, data: parsed.data };
}

function isEmptyJsonObject(raw: unknown): boolean {
  return (
    typeof raw === "object" &&
    raw !== null &&
    !Array.isArray(raw) &&
    Object.keys(raw).length === 0
  );
}
