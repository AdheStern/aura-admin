// src/features/catalogs/components/amplifier-datasheet.tsx — la potencia por impedancia es el
// dato que la simulación consume (resuelve electricalPowerW), así que se muestra completa y no
// resumida: son 1-4 cifras, una fila las comunica mejor que un gráfico.

import type { AmplifierSpec } from "@/contracts/amplifier-spec.schema";
import { SpecDatasheet } from "@/features/catalogs/components/spec-datasheet";
import {
  AMPLIFIER_KIND_LABEL,
  categoryLabel,
} from "@/features/catalogs/schemas/kind-labels";

/** "500 W @ 8Ω · 750 W @ 4Ω" — ordenado de mayor a menor impedancia, como los datasheets. */
function formatPower(power: AmplifierSpec["powerPerChannelW"]): string {
  return (["16", "8", "4", "2"] as const)
    .filter((ohm) => power[ohm] !== undefined)
    .map((ohm) => `${power[ohm]} W @ ${ohm}Ω`)
    .join(" · ");
}

export function AmplifierDatasheet({ spec }: { spec: AmplifierSpec }) {
  const processing = [
    spec.processing.dsp ? "DSP" : null,
    spec.processing.crossover ? "crossover" : null,
    spec.processing.limiter ? "limitador" : null,
    spec.processing.delayMaxMs !== undefined
      ? `delay hasta ${spec.processing.delayMaxMs} ms`
      : null,
  ].filter(Boolean);

  const rows: [string, string][] = [
    ["Tipo", categoryLabel(spec.kind, AMPLIFIER_KIND_LABEL)],
    [
      "Entradas / salidas",
      `${spec.io.inputChannels} entradas → ${spec.io.outputChannels} salidas`,
    ],
    ["Potencia por canal", formatPower(spec.powerPerChannelW)],
    ["Modo puente", spec.bridgeable ? "Disponible" : "No disponible"],
    ["Procesado", processing.length > 0 ? processing.join(" · ") : "Ninguno"],
    [
      "Eléctrico",
      `${spec.electrical.mainsVoltageV} V · ${spec.electrical.connectors.join(", ")}`,
    ],
    ["Físico", `${spec.physical.weightKg} kg · ${spec.physical.rackUnits}U`],
  ];

  return <SpecDatasheet rows={rows} />;
}
