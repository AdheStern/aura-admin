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
  // Color de la franja que identifica el tipo en el lienzo. Va en una franja y NO en el borde
  // porque el borde ya codifica la severidad de validación (rojo/ámbar): si el tipo también lo
  // usara, un nodo con error perdería su color o el error perdería el suyo. Clases literales
  // completas a propósito — Tailwind las descubre leyendo el código, no concatenando.
  accentClass: string;
};

const UNLIMITED = Number.POSITIVE_INFINITY;

export const FLOW_NODE_DEFINITIONS: Record<FlowNodeKind, FlowNodeDefinition> = {
  source: {
    kind: "source",
    label: "Fuente",
    catalogSlug: "sources",
    hasDatasheet: true,
    maxPerScene: UNLIMITED,
    accentClass: "bg-amber-500",
  },
  microphone: {
    kind: "microphone",
    label: "Micrófono",
    catalogSlug: "microphones",
    hasDatasheet: true,
    maxPerScene: UNLIMITED,
    accentClass: "bg-violet-500",
  },
  console: {
    kind: "console",
    label: "Consola",
    catalogSlug: "consoles",
    hasDatasheet: true,
    maxPerScene: UNLIMITED,
    accentClass: "bg-sky-500",
  },
  pa: {
    kind: "pa",
    label: "Amplificador / PA",
    catalogSlug: "amplifiers",
    hasDatasheet: true,
    maxPerScene: UNLIMITED,
    accentClass: "bg-rose-500",
  },
  speaker: {
    kind: "speaker",
    label: "Parlante",
    catalogSlug: "speakers",
    hasDatasheet: true,
    maxPerScene: UNLIMITED,
    accentClass: "bg-emerald-500",
  },
  simulation: {
    kind: "simulation",
    label: "Simulación",
    catalogSlug: null,
    hasDatasheet: false,
    maxPerScene: 1,
    accentClass: "bg-zinc-400",
  },
};

export function flowNodeDefinition(kind: FlowNodeKind): FlowNodeDefinition {
  return FLOW_NODE_DEFINITIONS[kind];
}

export function flowNodeLabel(kind: FlowNodeKind): string {
  return FLOW_NODE_DEFINITIONS[kind].label;
}
