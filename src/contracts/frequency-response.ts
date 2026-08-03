// src/contracts/frequency-response.ts — curva de respuesta en frecuencia compartida por los
// datasheets que la publican (SpeakerSpec, MicrophoneSpec). Vive aparte para que ambos midan
// lo mismo: si un contrato tabulara la curva de otra forma, el gráfico dejaría de ser comparable.

import { z } from "zod";

/** Punto de la curva: [Hz, dB relativos]. El motor la remuestrea a bandas. */
export const responsePointSchema = z.tuple([z.number().positive(), z.number()]);

/** Rango útil declarado por el fabricante: [mínima, máxima] en Hz. */
export const rangeHzSchema = z.tuple([
  z.number().positive(),
  z.number().positive(),
]);
