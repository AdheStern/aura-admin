// src/features/catalogs/components/console-datasheet.tsx — io es lo que gobierna los handles
// del nodo en el flujo de señal, así que va primero y se lee de un vistazo.

import type { ConsoleSpec } from "@/contracts/console-spec.schema";
import { SpecDatasheet } from "@/features/catalogs/components/spec-datasheet";
import {
  CONSOLE_KIND_LABEL,
  categoryLabel,
} from "@/features/catalogs/schemas/kind-labels";

export function ConsoleDatasheet({ spec }: { spec: ConsoleSpec }) {
  const rows: [string, string][] = [
    ["Tipo", categoryLabel(spec.kind, CONSOLE_KIND_LABEL)],
    [
      "Entradas / buses",
      `${spec.io.inputChannels} entradas → ${spec.io.outputBuses} buses`,
    ],
    [
      "Envíos auxiliares",
      spec.io.auxSends !== undefined ? `${spec.io.auxSends}` : "—",
    ],
    [
      "Salidas de matriz",
      spec.io.matrixOutputs !== undefined ? `${spec.io.matrixOutputs}` : "—",
    ],
    ["Trim", `${spec.gain.trimRangeDb[0]} a ${spec.gain.trimRangeDb[1]} dB`],
    ["Fader", `${spec.gain.faderRangeDb[0]} a ${spec.gain.faderRangeDb[1]} dB`],
    [
      "Alimentación phantom",
      spec.phantomPower.available
        ? spec.phantomPower.perChannel
          ? "Sí, por canal"
          : "Sí, global"
        : "No",
    ],
    [
      "Físico",
      spec.physical.rackUnits !== undefined
        ? `${spec.physical.weightKg} kg · ${spec.physical.rackUnits}U`
        : `${spec.physical.weightKg} kg`,
    ],
  ];

  return <SpecDatasheet rows={rows} />;
}
