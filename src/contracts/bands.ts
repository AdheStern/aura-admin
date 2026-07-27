// src/contracts/bands.ts — bandas de octava normativas (Sección 02 del doc maestro)

export const OCTAVE_BANDS_HZ = [125, 250, 500, 1000, 2000, 4000] as const;

export type OctaveBandHz = (typeof OCTAVE_BANDS_HZ)[number];
