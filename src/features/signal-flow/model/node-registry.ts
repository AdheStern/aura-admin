// src/features/signal-flow/model/node-registry.ts — registro único de los seis tipos de nodo
// (patrón Factory + Registry, Sección 9.1). Dar de alta un tipo de nodo se hace aquí y no en un
// switch por cada consumidor: la paleta del editor, el selector de catálogo y el validador leen
// todos de esta tabla.

import {
  AudioLinesIcon,
  GuitarIcon,
  type LucideIcon,
  MicIcon,
  SlidersHorizontalIcon,
  SpeakerIcon,
  WavesIcon,
} from "lucide-react";
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
  // Color con el que el tipo se reconoce en el lienzo. Tiñe la CABECERA del nodo y no su borde,
  // porque el borde ya codifica la severidad de validación (rojo/ámbar): si el tipo también lo
  // usara, un nodo con error perdería su color o el error perdería el suyo. Clases literales
  // completas a propósito — Tailwind las descubre leyendo el código, no concatenando.
  accentClass: string;
  accentTextClass: string;
  /** El icono es el mismo que usa su catálogo: el nodo y su lista se reconocen igual. */
  icon: LucideIcon;
};

const UNLIMITED = Number.POSITIVE_INFINITY;

export const FLOW_NODE_DEFINITIONS: Record<FlowNodeKind, FlowNodeDefinition> = {
  source: {
    kind: "source",
    label: "Fuente",
    catalogSlug: "sources",
    hasDatasheet: true,
    maxPerScene: UNLIMITED,
    accentClass: "bg-amber-500/10",
    accentTextClass: "text-amber-700 dark:text-amber-300",
    icon: GuitarIcon,
  },
  microphone: {
    kind: "microphone",
    label: "Micrófono",
    catalogSlug: "microphones",
    hasDatasheet: true,
    maxPerScene: UNLIMITED,
    accentClass: "bg-violet-500/10",
    accentTextClass: "text-violet-700 dark:text-violet-300",
    icon: MicIcon,
  },
  console: {
    kind: "console",
    label: "Consola",
    catalogSlug: "consoles",
    hasDatasheet: true,
    maxPerScene: UNLIMITED,
    accentClass: "bg-sky-500/10",
    accentTextClass: "text-sky-700 dark:text-sky-300",
    icon: SlidersHorizontalIcon,
  },
  pa: {
    kind: "pa",
    label: "Amplificador / PA",
    catalogSlug: "amplifiers",
    hasDatasheet: true,
    maxPerScene: UNLIMITED,
    accentClass: "bg-rose-500/10",
    accentTextClass: "text-rose-700 dark:text-rose-300",
    icon: AudioLinesIcon,
  },
  speaker: {
    kind: "speaker",
    label: "Parlante",
    catalogSlug: "speakers",
    hasDatasheet: true,
    maxPerScene: UNLIMITED,
    accentClass: "bg-emerald-500/10",
    accentTextClass: "text-emerald-700 dark:text-emerald-300",
    icon: SpeakerIcon,
  },
  simulation: {
    kind: "simulation",
    label: "Simulación",
    catalogSlug: null,
    hasDatasheet: false,
    maxPerScene: 1,
    accentClass: "bg-zinc-500/10",
    accentTextClass: "text-zinc-700 dark:text-zinc-300",
    icon: WavesIcon,
  },
};

export function flowNodeDefinition(kind: FlowNodeKind): FlowNodeDefinition {
  return FLOW_NODE_DEFINITIONS[kind];
}

export function flowNodeLabel(kind: FlowNodeKind): string {
  return FLOW_NODE_DEFINITIONS[kind].label;
}
