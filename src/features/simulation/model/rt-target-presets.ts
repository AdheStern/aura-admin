// src/features/simulation/model/rt-target-presets.ts — tipos de sala y su rango de RT60.
//
// La taxonomía vive AQUÍ y no en el motor (ADR 0003): "iglesia" o "auditorio" es vocabulario de
// producto en español, y el motor solo necesita el rango. La consecuencia práctica es que añadir un
// tipo de sala es un cambio solo-admin, sin desplegar el motor ni tocar el contrato.
//
// Los tres rangos son los que PUBLICA la tabla de métricas de la Sección 02 —"Palabra: 0.6–1.0 s ·
// Música sacra: 1.8–3.0 s · Auditorio mixto: 1.0–1.6 s"— y no se inventa ninguno más. Un cuarto
// tipo sin fuente sería un número con apariencia de norma, que es justo lo que prohíbe la
// "precisión honesta" de la §01.

import type { SimulationConfig } from "@/contracts";

export type RtTarget = NonNullable<SimulationConfig["rtTargetS"]>;

export type RtTargetPreset = {
  id: string;
  label: string;
  /** Para qué sirve la sala, no cómo se llama: es lo que el usuario reconoce. */
  hint: string;
  rangeS: RtTarget;
};

export const RT_TARGET_PRESETS: RtTargetPreset[] = [
  {
    id: "speech",
    label: "Palabra",
    hint: "Conferencias, teatro hablado, culto sin música",
    rangeS: [0.6, 1.0],
  },
  {
    id: "sacred_music",
    label: "Música sacra",
    hint: "Órgano y coro; la reverberación es parte del repertorio",
    rangeS: [1.8, 3.0],
  },
  {
    id: "mixed_auditorium",
    label: "Auditorio mixto",
    hint: "Palabra y música amplificada en la misma sala",
    rangeS: [1.0, 1.6],
  },
];

/** Qué preset corresponde a un rango, o null si es uno tecleado a mano. */
export function presetOf(target: RtTarget | null): RtTargetPreset | null {
  if (!target) return null;

  return (
    RT_TARGET_PRESETS.find(
      (preset) =>
        preset.rangeS[0] === target[0] && preset.rangeS[1] === target[1],
    ) ?? null
  );
}

/** Mismo criterio que el `.refine()` del contrato, para avisar al teclear y no al simular. */
export function isValidTarget(min: number, max: number): boolean {
  return min > 0 && max > 0 && min <= max;
}

export function formatTarget(target: RtTarget): string {
  return `${target[0].toFixed(1)} – ${target[1].toFixed(1)} s`;
}
