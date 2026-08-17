// src/features/simulation/schemas/panel-advice.ts — dónde colgar los paneles absorbentes.
//
// Contrato INTERNO de la app, como el de mezcla: no cruza a aura-engine ni pasa por la Sección 07.
// El motor sí sabe decir CUÁNTA absorción falta —lo hace, con `add_absorption`— pero no dónde
// ponerla: sus reglas trabajan sobre áreas de superficie, no sobre posiciones en un muro. Esa
// última milla es criterio, y por eso vive aquí.
//
// La posición se describe como una ABERTURA del recinto y no con coordenadas del mundo: muro,
// distancia desde su primer vértice, ancho y alto sobre el piso. Es la misma convención que
// `roomOpeningSchema` usa para una ventana, y por el mismo motivo — sobrevive a que el recinto se
// mueva o se le inserten vértices, y es como se acota en obra ("a 2 m de la esquina").
//
// `wallIndex` es el ÍNDICE DE ARISTA del footprint, que es la convención normativa del contrato
// (RoomGeometry: el k-ésimo muro es la arista del vértice k al k+1). No es un id: los ids de las
// fixtures se llaman wall_n/wall_s y no corresponden a los puntos cardinales.
//
// Los rangos de aquí no bastan: que un panel quepa en SU muro depende de la sala, no del schema, y
// eso se comprueba en model/panel-placement.ts. El modelo propone paneles que se salen por el borde
// con más frecuencia de la que parece.

import { z } from "zod";

/** Un panel de menos de medio metro no es tratamiento, es decoración. */
export const PANEL_MIN_LENGTH_M = 0.5;

export const acousticPanelSchema = z.object({
  /** Índice de arista del footprint: el muro k va del vértice k al k+1. */
  wallIndex: z.number().int().min(0).max(63),
  /** Distancia desde el primer vértice del muro hasta el borde del panel. */
  startM: z.number().min(0).max(200),
  lengthM: z.number().min(PANEL_MIN_LENGTH_M).max(30),
  /** Alto del panel. Con el `mountHeightM` decide a qué altura queda la banda absorbente. */
  heightM: z.number().min(PANEL_MIN_LENGTH_M).max(10),
  /** Desde el piso hasta el borde inferior del panel. */
  mountHeightM: z.number().min(0).max(10),
  label: z.string().min(1),
  reason: z.string().min(1),
});

export const panelAdviceSchema = z.object({
  /** Dos bastan para dar la idea; el máximo deja sitio a que el modelo se pase sin tirar todo. */
  panels: z.array(acousticPanelSchema).min(1).max(6),
  /** Qué material y con qué se monta: el consejo es inútil si no dice de qué es el panel. */
  material: z.string().min(1),
  summary: z.string().min(1),
});

export type AcousticPanel = z.infer<typeof acousticPanelSchema>;
export type PanelAdvice = z.infer<typeof panelAdviceSchema>;

export type ParsePanelAdviceResult =
  | { ok: true; data: PanelAdvice }
  | { ok: false; message: string };

/** El modelo suele envolver el JSON en un bloque markdown; se le quita antes de validar. */
export function parsePanelAdvice(raw: string): ParsePanelAdviceResult {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "");

  let candidate: unknown;
  try {
    candidate = JSON.parse(cleaned);
  } catch {
    return { ok: false, message: "La IA no devolvió JSON válido." };
  }

  const parsed = panelAdviceSchema.safeParse(candidate);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join(".");
    return {
      ok: false,
      message: path ? `${path}: ${issue.message}` : "Respuesta fuera de rango.",
    };
  }
  return { ok: true, data: parsed.data };
}
