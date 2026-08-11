// src/features/simulation/components/results/validity-notes.tsx — el margen de validez del cálculo.
//
// No es letra pequeña: el §01 pide "precisión honesta", y cada aviso nombra una aproximación que
// cambia cuánto se puede fiar uno de los números de arriba. Enseñar el resultado sin ellos sería
// dar por medido lo que está estimado.
//
// El vocabulario es cerrado (app/core/validity.py del motor). Uno desconocido se muestra crudo en
// vez de callarse: el despliegue va motor primero, así que un aviso nuevo puede llegar antes de que
// esta tabla lo conozca, y esconderlo sería justo lo contrario de lo que el aviso pretende.

import { TriangleAlert } from "lucide-react";
import type { SimulationMeta } from "@/contracts";

const WARNINGS: Record<string, string> = {
  air_absorption_disabled:
    "No se modeló la absorción del aire. En salas grandes y a 4 kHz el RT60 real será algo menor.",
  bands_below_schroeder:
    "Alguna banda pedida cae bajo la frecuencia de Schroeder: ahí el modelo geométrico no es válido.",
  pillar_approximation:
    "Los pilares no se restaron de la malla: se modelan como absorción añadida más sombra.",
  opening_approximation:
    "Las aberturas no perforan la malla: solo cambian el material de esa área.",
  scattering_floor_applied:
    "Algún material declaraba dispersión menor que 0.05 y se acotó a ese suelo.",
  sensitivity_reference_assumed:
    "Alguna ficha declara la sensibilidad en 2.83 V/1 m y se asumió 1 W/1 m: hasta 3 dB de diferencia.",
  eyring_selected_for_high_absorption:
    "La sala absorbe mucho (ᾱ ≥ 0.2): se usó Eyring en vez de Sabine.",
  complex_summation_below_schroeder:
    "Las cancelaciones bajo la frecuencia de Schroeder son indicativas, no medidas.",
  speaker_above_max_spl:
    "Alguna caja trabaja por encima de su máximo menos 6 dB de margen.",
  llm_writer_unavailable:
    "Se pidió redacción por LLM y no respondió: los textos son las plantillas deterministas.",
};

export function ValidityNotes({ meta }: { meta: SimulationMeta | null }) {
  if (!meta || meta.validity.warnings.length === 0) return null;

  return (
    <section className="rounded-md border border-amber-500/40 bg-amber-500/5 p-4">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-medium">
        <TriangleAlert
          className="size-4 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        Margen de validez
      </h2>

      <ul className="flex list-disc flex-col gap-1 pl-5 text-xs text-muted-foreground">
        {meta.validity.warnings.map((warning) => (
          <li key={warning}>{WARNINGS[warning] ?? warning}</li>
        ))}
      </ul>

      <p className="mt-2 text-xs text-muted-foreground">
        Calculado con {meta.methodsUsed.join(", ")} · Schroeder en{" "}
        {meta.validity.schroederHz.toFixed(1)} Hz · motor {meta.engineVersion}
      </p>
    </section>
  );
}
