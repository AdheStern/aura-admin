// src/features/signal-flow/model/node-registry.ts — registro único de los seis tipos de nodo
// (patrón Factory + Registry, Sección 9.1). Dar de alta un tipo de nodo se hace aquí y no en un
// switch por cada consumidor: la paleta del editor, el selector de catálogo y el validador leen
// todos de esta tabla.

import type { CatalogType } from "@/features/catalogs/catalog-types";
import type { FlowNodeKind } from "@/features/signal-flow/schemas/node-kinds";

export type FlowNodeDefinition = {
  kind: FlowNodeKind;
  label: string;
  /** Catálogo del que sale el ítem; null en simulation, que no es un aparato. */
  catalogSlug: CatalogType["slug"] | null;
  /** Si el panel lateral muestra datasheet al hacer click en el nodo (Sección 5.1). */
  hasDatasheet: boolean;
  /** Cuántos admite una escena. Solo simulation está limitado: es el sumidero del sistema. */
  maxPerScene: number;
};

const UNLIMITED = Number.POSITIVE_INFINITY;

export const FLOW_NODE_DEFINITIONS: Record<FlowNodeKind, FlowNodeDefinition> = {
  source: {
    kind: "source",
    label: "Fuente",
    catalogSlug: "sources",
    hasDatasheet: true,
    maxPerScene: UNLIMITED,
  },
  microphone: {
    kind: "microphone",
    label: "Micrófono",
    catalogSlug: "microphones",
    hasDatasheet: true,
    maxPerScene: UNLIMITED,
  },
  console: {
    kind: "console",
    label: "Consola",
    catalogSlug: "consoles",
    hasDatasheet: true,
    maxPerScene: UNLIMITED,
  },
  pa: {
    kind: "pa",
    label: "Amplificador / PA",
    catalogSlug: "amplifiers",
    hasDatasheet: true,
    maxPerScene: UNLIMITED,
  },
  speaker: {
    kind: "speaker",
    label: "Parlante",
    catalogSlug: "speakers",
    hasDatasheet: true,
    maxPerScene: UNLIMITED,
  },
  simulation: {
    kind: "simulation",
    label: "Simulación",
    catalogSlug: null,
    hasDatasheet: false,
    maxPerScene: 1,
  },
};

export function flowNodeLabel(kind: FlowNodeKind): string {
  return FLOW_NODE_DEFINITIONS[kind].label;
}
