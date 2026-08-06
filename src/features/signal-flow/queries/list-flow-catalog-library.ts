// src/features/signal-flow/queries/list-flow-catalog-library.ts — todo el catálogo de equipo, para
// el editor de flujo. Distinto propósito que resolve-flow-catalog.ts (que solo trae lo ya
// referenciado): aquí se necesita la lista completa porque el usuario tiene que poder ELEGIR entre
// todos los ítems, no solo entre los que ya están en el grafo. Con ~75 ítems sembrados en total
// entre los cinco catálogos, traerlos todos de una vez es más simple que paginar o buscar, y evita
// una ida y vuelta al servidor cada vez que se cambia el equipo de un nodo: el snapshot que resulta
// ya contiene cualquier ítem que el usuario pueda elegir.

import {
  type CatalogSnapshotEntry,
  catalogSnapshotKey,
  type FlowCatalogSnapshot,
} from "@/features/signal-flow/model/resolved-flow";
import { CATALOG_LOADERS } from "@/features/signal-flow/queries/catalog-loaders";
import type { FlowNodeKind } from "@/features/signal-flow/schemas/node-kinds";

export type CatalogPickerOption = { id: string; label: string };

export type FlowCatalogLibrary = {
  /** Para hydrateFlow, tanto en el primer render del servidor como al revalidar en el cliente. */
  snapshot: FlowCatalogSnapshot;
  /** Opciones del <Select> de cada tipo de nodo: solo los ítems con spec resuelto. */
  options: Record<Exclude<FlowNodeKind, "simulation">, CatalogPickerOption[]>;
};

export async function listFlowCatalogLibrary(): Promise<FlowCatalogLibrary> {
  const snapshot = new Map<string, CatalogSnapshotEntry>();
  const options: FlowCatalogLibrary["options"] = {
    source: [],
    microphone: [],
    console: [],
    pa: [],
    speaker: [],
  };

  await Promise.all(
    Object.entries(CATALOG_LOADERS).map(async ([kind, loader]) => {
      const catalogKind = kind as keyof typeof CATALOG_LOADERS;
      const rows = await loader.findMany();

      for (const row of rows) {
        const parsed = loader.schema.safeParse(row.spec);
        const isResolved = row.specVersion === "1" && parsed.success;

        snapshot.set(
          catalogSnapshotKey(catalogKind, row.id),
          isResolved
            ? ({ kind: catalogKind, spec: parsed.data } as never)
            : { kind: "unsupported" },
        );
        // Un ítem con spec sin resolver no es elegible para un nodo nuevo: ya hay un aviso
        // dedicado (CATALOG_SPEC_UNSUPPORTED) para cuando un nodo existente apunta a uno así.
        if (isResolved)
          options[catalogKind].push({ id: row.id, label: row.label });
      }
    }),
  );

  return { snapshot, options };
}
