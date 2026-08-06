// src/features/signal-flow/resolution/program-spectrum.ts — qué programa reproduce cada caja.
//
// El SimulationRequest no transporta espectros: lleva una ETIQUETA que el motor resuelve contra su
// tabla interna (aura-engine/app/core/acoustics_tables.py, ADR-03). Este archivo publica el
// vocabulario de esas etiquetas y cómo se deriva del grafo — la mitad que la Sección 5.1 dejaba
// explícitamente pendiente: "el mapeo fuente→espectro es tarea de Fase 2".
//
// Regla adoptada: una caja alimentada por UNA sola familia de fuentes hereda su espectro; si le
// llegan varias reproduce una mezcla de banda ancha y la etiqueta es `live_band` — el único valor
// que el doc publicaba, y el caso normal de un sistema real (batería + bajo + voces). Las familias
// no se inventan aquí: salen del enum `kind` de SourceSpec, así que añadir una al contrato rompe el
// build en este archivo hasta que se le asigne espectro.
//
// PENDIENTE DE FASE 5: SimulationRequest.programSpectrum es hoy `z.string()`. Estrecharlo a este
// enum es un cambio de contrato y el procedimiento de la Sección 07 exige desplegar PRIMERO el
// motor — imposible mientras el motor no exista y no conozca esta lista. Hasta entonces el
// vocabulario vive aquí y el contrato acepta cualquier cadena.

import type { SourceSpec } from "@/contracts/source-spec.schema";
import {
  type GraphIndex,
  isReachable,
  nodesOfKind,
} from "@/features/signal-flow/model/graph-index";

export const PROGRAM_SPECTRA = [
  "percussion",
  "strings",
  "keys",
  "vocals",
  /** Mezcla de dos o más familias: el programa de banda ancha habitual de un sistema de refuerzo. */
  "live_band",
  // Espectro sintético plano de CANON-01 (Apéndice A.1). El motor tiene que conocerlo porque la
  // fixture que comparten ambos repos lo usa, pero NINGÚN grafo lo produce: no existe una fuente
  // "plana" en el catálogo. Está en la lista para que el vocabulario publicado sea el completo.
  "flat_reference",
] as const;

export type ProgramSpectrum = (typeof PROGRAM_SPECTRA)[number];

/** Espectro de una caja alimentada por una única familia de fuentes. */
const SPECTRUM_BY_SOURCE_KIND: Record<SourceSpec["kind"], ProgramSpectrum> = {
  percussion: "percussion",
  strings: "strings",
  keys: "keys",
  vocals: "vocals",
};

const MIXED_PROGRAM_SPECTRUM: ProgramSpectrum = "live_band";

export const PROGRAM_SPECTRUM_LABEL: Record<ProgramSpectrum, string> = {
  percussion: "Percusión",
  strings: "Cuerdas",
  keys: "Teclados",
  vocals: "Voces",
  live_band: "Banda en vivo",
  flat_reference: "Referencia plana",
};

/**
 * Etiqueta de programa de una caja, o null si ninguna fuente la alcanza.
 *
 * Usa isReachable —el mismo primitivo que checkProgramReachability— a propósito: el validador
 * declara SPEAKER_WITHOUT_PROGRAM cuando esto devolvería null, y compartir el recorrido es lo que
 * garantiza que no puedan discrepar. La señal atraviesa el enlace entre cajas (el thru de un sub
 * alimenta al top con el mismo programa), y el nodo simulation no tiene salidas, así que ninguna
 * caja "contagia" su programa a otra por ese lado.
 */
export function resolveProgramSpectrum(
  index: GraphIndex,
  speakerId: string,
): ProgramSpectrum | null {
  const families = new Set<SourceSpec["kind"]>();

  for (const source of nodesOfKind(index, "source")) {
    if (!source.spec) continue;
    if (isReachable(index, source.id, speakerId))
      families.add(source.spec.kind);
  }

  if (families.size === 0) return null;
  if (families.size > 1) return MIXED_PROGRAM_SPECTRUM;

  const [only] = [...families];
  return only ? SPECTRUM_BY_SOURCE_KIND[only] : null;
}
