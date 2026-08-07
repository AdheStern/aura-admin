// src/features/room-editor/hooks/use-autosave-room.ts — autosave con debounce (Sección 5.1: 1.5 s).
// Calcado de use-autosave-flow.ts: el primer render es el documento ya persistido del servidor, así
// que no se reguarda solo por montar el editor; lo pendiente al desmontar se guarda igual sin
// esperar al debounce.

"use client";

import { type RefObject, useEffect, useRef } from "react";
import { saveRoom } from "@/features/room-editor/actions/save-room";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

const DEBOUNCE_MS = 1500;

export function useAutosaveRoom(): void {
  const sceneId = useRoomStore((state) => state.sceneId);
  const canManage = useRoomStore((state) => state.canManage);
  const document = useRoomStore((state) => state.document);
  const setSaveStatus = useRoomStore((state) => state.setSaveStatus);
  const applySaveResult = useRoomStore((state) => state.applySaveResult);

  // Ref y no cierre: el guardado del desmontaje corre cuando el cierre del efecto principal ya
  // quedó viejo, y sin esto persistiría el estado de un render anterior.
  const latest = useRef<RoomDocument>(document);
  latest.current = document;
  const isFirstRender = useRef(true);
  const isDirty = useRef(false);

  // document no se lee en el cuerpo (se usa latest.current a propósito): se declara solo para que
  // cada cambio reinicie el debounce, que es la mitad del contrato de este hook.
  // biome-ignore lint/correctness/useExhaustiveDependencies: ver comentario de arriba
  useEffect(() => {
    if (!canManage) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    isDirty.current = true;
    const timeoutId = setTimeout(() => {
      setSaveStatus("saving");
      void persist(sceneId, latest.current).then((result) => {
        isDirty.current = false;
        if (result.ok) applySaveResult(result.data);
        else setSaveStatus("error");
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [document, sceneId, canManage, setSaveStatus, applySaveResult]);

  useFlushOnUnmount(sceneId, latest, isDirty);
}

function useFlushOnUnmount(
  sceneId: string,
  latest: RefObject<RoomDocument>,
  isDirty: RefObject<boolean>,
): void {
  useEffect(() => {
    return () => {
      if (!isDirty.current) return;
      void persist(sceneId, latest.current);
    };
  }, [sceneId, latest, isDirty]);
}

function persist(sceneId: string, document: RoomDocument) {
  return saveRoom(sceneId, document);
}
