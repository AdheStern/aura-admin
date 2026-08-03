// src/features/catalogs/components/microphone-datasheet.tsx — la curva de respuesta va al
// gráfico (frequency-response-chart.tsx), aquí solo el rango y el resto de datos de placa.

import type { MicrophoneSpec } from "@/contracts/microphone-spec.schema";
import { SpecDatasheet } from "@/features/catalogs/components/spec-datasheet";
import {
  categoryLabel,
  MICROPHONE_KIND_LABEL,
  MICROPHONE_PATTERN_LABEL,
} from "@/features/catalogs/schemas/kind-labels";

export function MicrophoneDatasheet({ spec }: { spec: MicrophoneSpec }) {
  const rows: [string, string][] = [
    ["Tipo", categoryLabel(spec.kind, MICROPHONE_KIND_LABEL)],
    [
      "Patrón polar",
      categoryLabel(spec.polarPattern, MICROPHONE_PATTERN_LABEL),
    ],
    [
      "Rango de frecuencia",
      `${spec.frequencyResponse.rangeHz[0]}–${spec.frequencyResponse.rangeHz[1]} Hz`,
    ],
    ["Sensibilidad", `${spec.sensitivity.mvPerPa} mV/Pa`],
    [
      "SPL máximo",
      spec.maxSpl.thdPct !== undefined
        ? `${spec.maxSpl.dbSpl} dB SPL (${spec.maxSpl.thdPct}% THD)`
        : `${spec.maxSpl.dbSpl} dB SPL`,
    ],
    [
      "Ruido propio",
      spec.selfNoise ? `${spec.selfNoise.dbaSpl} dB(A)` : "No publicado",
    ],
    [
      "Eléctrico",
      `${spec.electrical.impedanceOhm}Ω · ${spec.electrical.connector} · ${
        spec.electrical.phantomPowerRequired
          ? "requiere phantom"
          : "sin phantom"
      }`,
    ],
    [
      "Físico",
      spec.physical.dimensionsMm
        ? `${spec.physical.weightKg} kg · ${spec.physical.dimensionsMm.join("×")} mm`
        : `${spec.physical.weightKg} kg`,
    ],
  ];

  return <SpecDatasheet rows={rows} />;
}
