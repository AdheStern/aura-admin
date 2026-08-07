// src/features/room-editor/components/import-export-controls.tsx — exportar el documento actual a
// un archivo .json y volver a cargarlo (Tarea 3, §5.2: "export/import del JSON"). Es el mismo
// RoomDocument que Scene.room persiste, así que un archivo exportado siempre es importable de
// vuelta — round-trip sin pérdida, y también el formato de las fixtures de fixtures/*.json.
//
// Exportar no muta nada: se ofrece incluso a quien solo puede ver la escena. Importar sí, y pasa
// por importDocument → el comando replaceDocument (Tarea 1 ampliada), así que queda deshacible como
// cualquier otro cambio.

"use client";

import { DownloadIcon, UploadIcon } from "lucide-react";
import { type ChangeEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { parseRoom } from "@/features/room-editor/schemas/parse-room";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function ImportExportControls() {
  const document = useRoomStore((state) => state.document);
  const canManage = useRoomStore((state) => state.canManage);
  const importDocument = useRoomStore((state) => state.importDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function handleExport() {
    const blob = new Blob([JSON.stringify(document, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = "recinto.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Se limpia ya: sin esto, reimportar el MISMO archivo dos veces seguidas no dispararía
    // `onChange` la segunda vez (el input seguiría teniendo ese valor).
    event.target.value = "";
    if (!file) return;

    let raw: unknown;
    try {
      raw = JSON.parse(await file.text());
    } catch {
      setImportError("El archivo no es JSON válido.");
      return;
    }

    const parsed = parseRoom(raw);
    if (!parsed.ok) {
      setImportError(parsed.message);
      return;
    }
    setImportError(null);
    importDocument(parsed.data);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleExport}>
        <DownloadIcon /> Exportar JSON
      </Button>
      {canManage ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadIcon /> Importar JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFileChange}
          />
          {importError ? (
            <span className="text-xs text-destructive">{importError}</span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
