// src/features/catalogs/schemas/kind-labels.ts — etiquetas legibles del `kind` de cada contrato
// de equipo. Los Record están tipados contra el enum del contrato, así que añadir un kind nuevo
// rompe el build aquí hasta que se le dé nombre: nunca aparece un identificador crudo en la UI.

import type { AmplifierSpec } from "@/contracts/amplifier-spec.schema";
import { amplifierSpecSchema } from "@/contracts/amplifier-spec.schema";
import type { ConsoleSpec } from "@/contracts/console-spec.schema";
import { consoleSpecSchema } from "@/contracts/console-spec.schema";
import type { MicrophoneSpec } from "@/contracts/microphone-spec.schema";
import { microphoneSpecSchema } from "@/contracts/microphone-spec.schema";
import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";
import { speakerSpecSchema } from "@/contracts/speaker-spec.schema";

export const SPEAKER_KIND_LABEL: Record<SpeakerSpec["kind"], string> = {
  point_source: "Punto de fuente",
  line_array_element: "Elemento de line array",
  subwoofer: "Subwoofer",
  monitor: "Monitor",
};

export const MICROPHONE_KIND_LABEL: Record<MicrophoneSpec["kind"], string> = {
  dynamic: "Dinámico",
  condenser: "Condensador",
  ribbon: "Cinta",
};

export const MICROPHONE_PATTERN_LABEL: Record<
  MicrophoneSpec["polarPattern"],
  string
> = {
  omnidirectional: "Omnidireccional",
  cardioid: "Cardioide",
  supercardioid: "Supercardioide",
  hypercardioid: "Hipercardioide",
  figure_8: "Bidireccional (figura 8)",
  shotgun: "Cañón",
};

export const CONSOLE_KIND_LABEL: Record<ConsoleSpec["kind"], string> = {
  analog: "Analógica",
  digital: "Digital",
};

export const AMPLIFIER_KIND_LABEL: Record<AmplifierSpec["kind"], string> = {
  amplifier: "Amplificador",
  amplifier_dsp: "Amplificador con DSP",
};

export const SPEAKER_CATEGORIES = speakerSpecSchema.shape.kind.options;
export const MICROPHONE_CATEGORIES = microphoneSpecSchema.shape.kind.options;
export const CONSOLE_CATEGORIES = consoleSpecSchema.shape.kind.options;
export const AMPLIFIER_CATEGORIES = amplifierSpecSchema.shape.kind.options;

/** Opciones del filtro por categoría, derivadas del enum del contrato. */
export function toCategoryOptions<K extends string>(
  kinds: readonly K[],
  labels: Record<K, string>,
): { value: string; label: string }[] {
  return kinds.map((kind) => ({ value: kind, label: labels[kind] }));
}

/** Etiqueta de una categoría leída de BD; cae al valor crudo si el contrato ya no la declara. */
export function categoryLabel<K extends string>(
  category: string,
  labels: Record<K, string>,
): string {
  return labels[category as K] ?? category;
}
