// src/features/room-editor/history/commands/document-commands.ts — reemplazo del documento
// entero. Un solo comando (Tarea 3: importar JSON), no una familia insert/remove/replace: no hay
// "varios documentos" entre los que insertar o quitar, así que las tres verbos de las demás
// familias no aplican aquí.

import type { RoomCommandHandler } from "@/features/room-editor/history/command-result";

export const applyReplaceDocument: RoomCommandHandler<"replaceDocument"> = (
  document,
  command,
) => ({
  next: command.document,
  inverse: { kind: "replaceDocument", document },
});
