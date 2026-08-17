// src/features/simulation/model/mix-clipboard.ts — el channel strip como texto para pegar.
//
// Quien está delante de la mesa no puede leer una pantalla y teclear a la vez: copia el bloque, lo
// pega en sus notas y ajusta. Por eso el formato es de lectura humana y no JSON.
//
// Va con la marca de quién lo propuso. Sacado de la pantalla, un `ratio 3:1` pegado en un documento
// pierde la sección que decía que es criterio de un modelo y no una cifra medida — y eso es justo
// lo que no puede perderse.

import { formatPan } from "@/features/simulation/model/mix-levels";
import type {
  InstrumentMix,
  MixBand,
} from "@/features/simulation/schemas/mix-advice";

const FILTER_LABELS: Record<string, string> = {
  peak: "Campana",
  low_shelf: "Shelf bajo",
  high_shelf: "Shelf alto",
  high_pass: "Pasa-altos",
  low_pass: "Pasa-bajos",
};

export function formatHz(value: number): string {
  return value >= 1000
    ? `${Number((value / 1000).toFixed(1))} kHz`
    : `${value} Hz`;
}

export function formatGain(value: number): string {
  return `${value > 0 ? "+" : ""}${value} dB`;
}

export function filterLabel(type: string): string {
  return FILTER_LABELS[type] ?? type;
}

export function formatChannelStrip(
  instrument: InstrumentMix,
  origin: { provider: string; model: string },
): string {
  const { level, eq, reverb, compression } = instrument;

  return [
    instrument.instrumentName,
    "".padEnd(instrument.instrumentName.length, "="),
    "",
    // El nivel va primero porque es lo primero que se toca al montar: el balance antes que el
    // detalle, igual que en la pantalla.
    "NIVEL",
    `  Fader: ${formatGain(level.gainDb)} · Pan: ${formatPan(level.panPercent)}`,
    `  → ${level.description}`,
    "",
    "ECUALIZACIÓN",
    ...eq.bands.map(bandLine),
    `  → ${eq.description}`,
    "",
    "REVERB",
    `  Tipo: ${reverb.type}`,
    `  Tiempo: ${reverb.timeMs} ms · Pre-delay: ${reverb.preDelayMs} ms · Mezcla: ${reverb.mixPercent} %`,
    `  → ${reverb.description}`,
    "",
    "COMPRESIÓN",
    `  Umbral: ${compression.thresholdDb} dB · Ratio: ${compression.ratio}:1`,
    `  Ataque: ${compression.attackMs} ms · Release: ${compression.releaseMs} ms · Makeup: ${formatGain(compression.makeupGainDb)}`,
    `  → ${compression.description}`,
    "",
    `Criterio propuesto por ${origin.provider} (${origin.model}), no medido por el motor.`,
  ].join("\n");
}

function bandLine(band: MixBand): string {
  return `  ${band.band}. ${formatHz(band.frequencyHz)} · ${formatGain(band.gainDb)} · Q ${band.q} · ${filterLabel(band.filterType)}`;
}
