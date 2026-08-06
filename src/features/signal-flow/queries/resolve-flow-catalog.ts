// src/features/signal-flow/queries/resolve-flow-catalog.ts — los datasheets que un documento ya
// guardado referencia. Lo usa la Server Action de guardado para revalidar de forma autoritativa e
// independiente del cliente: solo pide las filas que el grafo entrante realmente nombra, así que un
// grafo con doce cajas del mismo modelo pide esa fila una vez, no doce.
//
// El spec se valida al leer, igual que en toEquipmentDetail: una fila guardada con otra specVersion
// se marca "unsupported" en vez de reventar el guardado.

import {
  type CatalogSnapshotEntry,
  catalogSnapshotKey,
  type FlowCatalogSnapshot,
} from "@/features/signal-flow/model/resolved-flow";
import {
  CATALOG_LOADERS,
  type CatalogKind,
} from "@/features/signal-flow/queries/catalog-loaders";
import type { SignalFlowDocument } from "@/features/signal-flow/schemas/signal-flow";

export async function resolveFlowCatalog(
  document: SignalFlowDocument,
): Promise<FlowCatalogSnapshot> {
  const idsByKind = groupReferencedIds(document);
  const snapshot = new Map<string, CatalogSnapshotEntry>();

  await Promise.all(
    Object.entries(idsByKind).map(async ([kind, ids]) => {
      if (ids.size === 0) return;
      const loader = CATALOG_LOADERS[kind as CatalogKind];
      const rows = await loader.findMany([...ids]);

      for (const row of rows) {
        const parsed = loader.schema.safeParse(row.spec);
        const entry: CatalogSnapshotEntry =
          row.specVersion === "1" && parsed.success
            ? ({
                kind: kind as CatalogKind,
                spec: parsed.data,
              } as CatalogSnapshotEntry)
            : { kind: "unsupported" };
        snapshot.set(catalogSnapshotKey(kind as CatalogKind, row.id), entry);
      }
    }),
  );

  return snapshot;
}

function groupReferencedIds(
  document: SignalFlowDocument,
): Record<CatalogKind, Set<string>> {
  const grouped: Record<CatalogKind, Set<string>> = {
    source: new Set<string>(),
    microphone: new Set<string>(),
    console: new Set<string>(),
    pa: new Set<string>(),
    speaker: new Set<string>(),
  };

  for (const node of document.nodes) {
    if (node.data.kind === "simulation" || node.data.catalogItemId === null) {
      continue;
    }
    grouped[node.data.kind].add(node.data.catalogItemId);
  }
  return grouped;
}
