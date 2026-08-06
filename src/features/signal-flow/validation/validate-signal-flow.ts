// src/features/signal-flow/validation/validate-signal-flow.ts — el validador de "sistema completo".
// Responde una sola pregunta: ¿este grafo describe un sistema que se puede simular? Su veredicto
// es lo que mueve la escena entre DRAFT y FLOW_READY (Sección 08).
//
// El orden de los checks es el de lectura, no el de dependencia: primero lo estructural (falta el
// sumidero, faltan datasheets), después el cableado, y al final la física. Todos corren siempre —
// no se corta en el primer error — porque el editor pinta TODOS los problemas a la vez sobre el
// lienzo y arreglar de uno en uno con recarga entre medias sería insufrible.

import { buildGraphIndex } from "@/features/signal-flow/model/graph-index";
import type { ResolvedFlow } from "@/features/signal-flow/model/resolved-flow";
import {
  checkCatalogRefs,
  checkEdges,
  checkProgramReachability,
  checkSimulationNode,
  checkSpeakerFeeds,
  checkWiringHygiene,
} from "@/features/signal-flow/validation/checks";
import type { FlowIssue } from "@/features/signal-flow/validation/issue-codes";

export type SignalFlowValidation = {
  isComplete: boolean;
  errors: FlowIssue[];
  warnings: FlowIssue[];
};

const CHECKS = [
  checkSimulationNode,
  checkCatalogRefs,
  checkEdges,
  checkSpeakerFeeds,
  checkProgramReachability,
  checkWiringHygiene,
];

export function validateSignalFlow(flow: ResolvedFlow): SignalFlowValidation {
  const index = buildGraphIndex(flow);
  const issues = CHECKS.flatMap((check) => check(index));

  const errors = issues.filter((issue) => issue.severity === "error");
  return {
    isComplete: errors.length === 0,
    errors,
    warnings: issues.filter((issue) => issue.severity === "warning"),
  };
}
