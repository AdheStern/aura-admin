// src/features/room-3d/model/nrc-color.ts — color de una superficie por su NRC (§5.3: "código de
// color por NRC para feedback visual"). NRC alto = absorbe más energía = "más verde" es la lectura
// acústica correcta, no una elección estética libre; por eso la escala va roja→verde y no es
// configurable.

import type { MaterialSpec } from "@/contracts/material-spec.schema";

const NRC_BANDS = ["250", "500", "1000", "2000"] as const;

/** Mismo criterio que documenta el comentario de `nrc` en material-spec.schema.ts: promedio de las
 *  cuatro bandas centrales, redondeado a 0.05. Se usa como respaldo — el catálogo puede traer el
 *  NRC ya calculado y ese es el que manda. */
export function deriveNrc(
  spec: Pick<MaterialSpec, "nrc" | "absorption">,
): number {
  if (spec.nrc !== undefined) return spec.nrc;

  const sum = NRC_BANDS.reduce(
    (total, band) => total + (spec.absorption[band] ?? 0),
    0,
  );
  return Math.round((sum / NRC_BANDS.length) * 20) / 20;
}

const UNASSIGNED_HEX = "#9ca3af";
const LOW_RGB: readonly [number, number, number] = [239, 68, 68];
const HIGH_RGB: readonly [number, number, number] = [34, 197, 94];

/** `null` = sin material asignado (mismo significado que en MaterialSelect): gris neutro, ni
 *  absorbente ni reflectante porque no hay dato del que partir. */
export function nrcColorHex(nrc: number | null): string {
  if (nrc === null) return UNASSIGNED_HEX;

  const t = Math.min(1, Math.max(0, nrc));
  const [r, g, b] = LOW_RGB.map((low, i) =>
    Math.round(low + (HIGH_RGB[i] - low) * t),
  );
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
