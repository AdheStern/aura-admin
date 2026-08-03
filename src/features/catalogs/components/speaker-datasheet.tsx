// src/features/catalogs/components/speaker-datasheet.tsx — vista estructurada de los campos
// relevantes del datasheet (no todos los campos: 9 grupos con sentido para escanear).

import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";
import { SpecDatasheet } from "@/features/catalogs/components/spec-datasheet";
import {
  categoryLabel,
  SPEAKER_KIND_LABEL,
} from "@/features/catalogs/schemas/kind-labels";

export function SpeakerDatasheet({ spec }: { spec: SpeakerSpec }) {
  const rows: [string, string][] = [
    ["Tipo", categoryLabel(spec.kind, SPEAKER_KIND_LABEL)],
    [
      "Transductores",
      `${spec.transducers.lf ?? "—"} / ${spec.transducers.hf ?? "—"}`,
    ],
    [
      "Potencia",
      `${spec.power.continuousW}W continua · ${spec.power.programW}W programa · ${spec.power.peakW}W pico · ${spec.power.impedanceOhm}Ω`,
    ],
    [
      "Sensibilidad",
      `${spec.sensitivity.dbSpl1w1m} dB SPL (${spec.sensitivity.reference})`,
    ],
    [
      "SPL máximo",
      `${spec.maxSpl.continuousDb} dB continuo · ${spec.maxSpl.peakDb} dB pico`,
    ],
    [
      "Rango de frecuencia",
      `${spec.frequencyResponse.rangeHz[0]}–${spec.frequencyResponse.rangeHz[1]} Hz (±${spec.frequencyResponse.toleranceDb} dB)`,
    ],
    [
      "Cobertura nominal",
      `${spec.directivity.nominalCoverage.hDeg}° × ${spec.directivity.nominalCoverage.vDeg}°`,
    ],
    [
      "Físico",
      `${spec.physical.weightKg} kg · ${spec.physical.dimensionsMm.join("×")} mm`,
    ],
    ["Conectores", spec.electrical.connectors.join(", ")],
  ];

  return <SpecDatasheet rows={rows} />;
}
