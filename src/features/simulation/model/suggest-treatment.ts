// src/features/simulation/model/suggest-treatment.ts — de "faltan 58 m² sabin" a qué y dónde.
//
// El motor entrega los m² sabin que faltan y no puede pasar de ahí: no ve el catálogo (ADR-02).
// Esta es la mitad que resuelve la app, y es la que la Sección 5.4 pide como "m² y tipo de
// absorción sugerida POR SUPERFICIE".
//
// FÍSICA — la trampa está aquí: tratar una superficie SUSTITUYE su absorción, no la suma. Cubrir
// S m² de un muro que ya tiene α_actual con un material de α_nuevo gana S·(α_nuevo − α_actual)
// sabins, no S·α_nuevo. Usar lo segundo pediría menos metros de los necesarios, y tanto más cuanto
// más absorbente fuera ya el muro. De ahí:
//
//     S = ΔA / (α_nuevo − α_actual)
//
// Un material que no mejora lo que ya hay (α_nuevo ≤ α_actual) no sirve en esa superficie por mucha
// área que tenga, y se descarta en vez de proponerlo con un número enorme.
//
// Se dimensiona en la BANDA QUE MANDA (`worstBandHz` del motor). Es una sugerencia de primer orden
// sobre Sabine, no un diseño acústico: el mismo material puede pasarse en las bandas altas, y por
// eso la UI dice en qué banda está dimensionado.

import type { TreatableSurface } from "@/features/simulation/model/treatable-surfaces";

export type TreatmentDirection = "add" | "reduce";

export type AbsorptionCandidate = {
  id: string;
  name: string;
  /** α por banda, con la banda como clave string ("125"…). */
  absorption: Record<string, number>;
};

export type TreatmentSuggestion = {
  materialId: string;
  materialName: string;
  surfaceId: string;
  surfaceLabel: string;
  surfaceAreaM2: number;
  /** m² que hay que cubrir en esa superficie. */
  areaM2: number;
  /** Fracción de la superficie que ocuparía, 0–1. */
  coverage: number;
  alpha: number;
  currentAlpha: number;
};

export function suggestTreatment(input: {
  direction: TreatmentDirection;
  bandKey: string;
  deltaAbsorptionM2: number;
  surfaces: TreatableSurface[];
  /** materialId → α por banda del material que YA lleva cada superficie. */
  installed: Record<string, Record<string, number>>;
  candidates: AbsorptionCandidate[];
  limit?: number;
}): TreatmentSuggestion[] {
  const { direction, bandKey, deltaAbsorptionM2, limit = 4 } = input;
  if (!(deltaAbsorptionM2 > 0)) return [];

  const found: TreatmentSuggestion[] = [];

  for (const surface of input.surfaces) {
    const currentAlpha = input.installed[surface.materialId]?.[bandKey];
    if (typeof currentAlpha !== "number") continue;

    for (const candidate of input.candidates) {
      const alpha = candidate.absorption[bandKey];
      if (typeof alpha !== "number") continue;

      const gain =
        direction === "add" ? alpha - currentAlpha : currentAlpha - alpha;
      if (gain <= 0) continue;

      const areaM2 = deltaAbsorptionM2 / gain;
      if (areaM2 > surface.areaM2) continue;

      found.push({
        materialId: candidate.id,
        materialName: candidate.name,
        surfaceId: surface.id,
        surfaceLabel: surface.label,
        surfaceAreaM2: surface.areaM2,
        areaM2,
        coverage: areaM2 / surface.areaM2,
        alpha,
        currentAlpha,
      });
    }
  }

  return bestPerMaterial(found).slice(0, limit);
}

/**
 * Una fila por material, la de menos metros. La lista responde "qué compro"; repetir el mismo
 * material en cinco muros llenaría la tarjeta sin añadir una sola opción nueva.
 *
 * Menos metros primero: la intervención mínima, el mismo criterio con el que el motor elige el
 * borde del rango y no su centro.
 */
function bestPerMaterial(all: TreatmentSuggestion[]): TreatmentSuggestion[] {
  const best = new Map<string, TreatmentSuggestion>();

  for (const suggestion of all) {
    const previous = best.get(suggestion.materialId);
    if (!previous || suggestion.areaM2 < previous.areaM2) {
      best.set(suggestion.materialId, suggestion);
    }
  }

  return [...best.values()].sort((a, b) => a.areaM2 - b.areaM2);
}
