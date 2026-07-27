// src/contracts/bands.ts — bandas de octava normativas (Sección 02 del doc maestro)

import { z } from "zod";

/** Bandas de análisis v1. Toda métrica por banda usa exactamente estas seis. */
export const OCTAVE_BANDS_HZ = [125, 250, 500, 1000, 2000, 4000] as const;

export type OctaveBandHz = (typeof OCTAVE_BANDS_HZ)[number];

export const octaveBandHzSchema = z.literal(OCTAVE_BANDS_HZ);

/** Las mismas bandas como claves: JSON solo admite claves string. */
export const OCTAVE_BAND_KEYS = [
  "125",
  "250",
  "500",
  "1000",
  "2000",
  "4000",
] as const;

export type OctaveBandKey = (typeof OCTAVE_BAND_KEYS)[number];

export const octaveBandKeySchema = z.enum(OCTAVE_BAND_KEYS);

/** Valor por banda con las seis bandas obligatorias (coeficientes de material, RT60…). */
export const byBandSchema = z.record(octaveBandKeySchema, z.number());

/** Valor por banda parcial: el datasheet solo publica algunas bandas (p. ej. DI). */
export const partialByBandSchema = z.partialRecord(
  octaveBandKeySchema,
  z.number(),
);
