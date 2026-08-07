// src/features/room-3d/hooks/use-autosave-speaker-audio.ts — mismo debounce de 1.5 s que
// use-autosave-room, sobre la otra mitad del editor 3D: los ajustes que viven en el grafo.
//
// Manda solo los nodos marcados como sucios, uno por llamada. Son escrituras puntuales sobre nodos
// distintos —no un documento que se reemplaza entero—, así que no compiten entre sí; lo que sí
// evita el debounce es una escritura por cada tecla mientras se escribe un delay.

"use client";

import { useEffect, useRef } from "react";
import { updateSpeakerAudio } from "@/features/room-3d/actions/update-speaker-audio";
import { useSpeakerStore } from "@/features/room-3d/store/speaker-store";
import type { SpeakerAudio } from "@/features/signal-flow/schemas/node-data";

const DEBOUNCE_MS = 1500;

export function useAutosaveSpeakerAudio(): void {
  const sceneId = useSpeakerStore((state) => state.sceneId);
  const canManage = useSpeakerStore((state) => state.canManage);
  const dirtyNodeIds = useSpeakerStore((state) => state.dirtyNodeIds);
  const audioByNodeId = useSpeakerStore((state) => state.audioByNodeId);
  const clearDirty = useSpeakerStore((state) => state.clearDirty);

  // Ref y no cierre, por lo mismo que en use-autosave-room: el temporizador dispara después y sin
  // esto persistiría el valor del render en que se programó, no el último que escribió el usuario.
  const latest = useRef<Record<string, SpeakerAudio>>(audioByNodeId);
  latest.current = audioByNodeId;

  useEffect(() => {
    if (!canManage || dirtyNodeIds.length === 0) return;

    const timeoutId = setTimeout(() => {
      const pending = [...dirtyNodeIds];
      clearDirty(pending);
      for (const nodeId of pending) {
        const audio = latest.current[nodeId];
        if (audio) void updateSpeakerAudio(sceneId, nodeId, audio);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [dirtyNodeIds, sceneId, canManage, clearDirty]);
}
