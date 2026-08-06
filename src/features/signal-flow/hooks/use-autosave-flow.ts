// src/features/signal-flow/hooks/use-autosave-flow.ts — autosave con debounce (Sección 5.1: 1.5 s).
// El primer render es el documento que ya vino persistido del servidor — no se reguarda solo por
// montar el editor. Cada cambio posterior reinicia el temporizador; si el usuario navega fuera
// antes de que dispare, el cambio pendiente se guarda igual al desmontar (no se pierde).

"use client";

import type { Viewport } from "@xyflow/react";
import { type RefObject, useEffect, useRef } from "react";
import { saveSignalFlow } from "@/features/signal-flow/actions/save-signal-flow";
import {
  type FlowRfEdge,
  type FlowRfNode,
  toSignalFlowDocument,
} from "@/features/signal-flow/mapping/react-flow-adapter";
import { useFlowStore } from "@/features/signal-flow/store/flow-store-provider";

const DEBOUNCE_MS = 1500;

type PendingFlow = {
  nodes: FlowRfNode[];
  edges: FlowRfEdge[];
  viewport: Viewport;
};

export function useAutosaveFlow(): void {
  const sceneId = useFlowStore((state) => state.sceneId);
  const canManage = useFlowStore((state) => state.canManage);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const viewport = useFlowStore((state) => state.viewport);
  const setSaveStatus = useFlowStore((state) => state.setSaveStatus);
  const applySaveResult = useFlowStore((state) => state.applySaveResult);

  // Ref y no cierre: el guardado del desmontaje corre cuando el cierre del efecto principal ya
  // quedó viejo, y sin esto persistiría el estado de un render anterior.
  const latest = useRef<PendingFlow>({ nodes, edges, viewport });
  latest.current = { nodes, edges, viewport };
  const isFirstRender = useRef(true);
  const isDirty = useRef(false);

  // nodes/edges/viewport no se leen en el cuerpo (se usa latest.current a propósito, para no cerrar
  // sobre un valor viejo): se declaran solo para que cada cambio reinicie el debounce, que es la
  // mitad del contrato de este hook. Quitarlos "arregla" el lint pero rompe el autosave.
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
  }, [
    nodes,
    edges,
    viewport,
    sceneId,
    canManage,
    setSaveStatus,
    applySaveResult,
  ]);

  useFlushOnUnmount(sceneId, latest, isDirty);
}

/** Lo que quedó pendiente al salir del editor se guarda sin esperar al debounce. */
function useFlushOnUnmount(
  sceneId: string,
  latest: RefObject<PendingFlow>,
  isDirty: RefObject<boolean>,
): void {
  useEffect(() => {
    return () => {
      if (!isDirty.current) return;
      void persist(sceneId, latest.current);
    };
  }, [sceneId, latest, isDirty]);
}

function persist(sceneId: string, pending: PendingFlow) {
  return saveSignalFlow(
    sceneId,
    toSignalFlowDocument(pending.nodes, pending.edges, pending.viewport),
  );
}
