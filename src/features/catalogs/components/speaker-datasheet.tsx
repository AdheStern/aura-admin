// src/features/catalogs/components/speaker-datasheet.tsx — vista estructurada de los campos
// relevantes del datasheet (no todos los campos, ver plan: 9 grupos con sentido para escanear).

import type { SpeakerSpec } from "@/contracts/speaker-spec.schema";

export function SpeakerDatasheet({ spec }: { spec: SpeakerSpec }) {
  const rows: [string, string][] = [
    ["Tipo", spec.kind],
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

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
      {rows.map(([label, value]) => (
        <div className="contents" key={label}>
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
