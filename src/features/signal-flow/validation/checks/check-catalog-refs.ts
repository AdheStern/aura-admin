// src/features/signal-flow/validation/checks/check-catalog-refs.ts — cada nodo de equipo tiene
// que apuntar a una fila de catálogo legible. Sin spec no hay puertos, ni impedancia, ni
// directividad: el nodo es un dibujo.
//
// Los tres motivos se separan porque piden acciones distintas del usuario: elegir un ítem, sustituir
// uno borrado, o corregir un datasheet guardado con una specVersion que este build no lee.

import type { GraphIndex } from "@/features/signal-flow/model/graph-index";
import { flowNodeLabel } from "@/features/signal-flow/model/node-registry";
import type { ResolvedNode } from "@/features/signal-flow/model/resolved-flow";
import {
  type FlowIssue,
  flowIssue,
} from "@/features/signal-flow/validation/issue-codes";

export function checkCatalogRefs(index: GraphIndex): FlowIssue[] {
  const issues: FlowIssue[] = [];
  for (const node of index.nodes.values()) {
    const issue = issueFor(node);
    if (issue) issues.push(issue);
  }
  return issues;
}

function issueFor(node: ResolvedNode): FlowIssue | null {
  const target = { nodeId: node.id };
  const label = flowNodeLabel(node.kind);

  switch (node.specStatus) {
    case "not_selected":
      return flowIssue(
        "NODE_WITHOUT_CATALOG_ITEM",
        `${label} sin equipo elegido del catálogo.`,
        target,
      );
    case "item_missing":
      return flowIssue(
        "CATALOG_ITEM_MISSING",
        `El equipo de este nodo (${label}) ya no está en el catálogo.`,
        target,
      );
    case "unsupported_version":
      return flowIssue(
        "CATALOG_SPEC_UNSUPPORTED",
        `El datasheet de este ${label.toLowerCase()} usa una versión de contrato que esta app no sabe leer.`,
        target,
      );
    default:
      return null;
  }
}
