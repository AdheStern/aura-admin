// src/features/catalogs/components/source-datasheet.tsx — sin gráfico a propósito: el espectro
// por banda de una fuente vive en la tabla del motor, no en este catálogo, así que no hay curva
// que dibujar. Lo que sí se muestra es el rango de fundamentales y la clase de energía.

import type { SourceSpec } from "@/contracts/source-spec.schema";
import { SpecDatasheet } from "@/features/catalogs/components/spec-datasheet";
import {
  ACOUSTIC_POWER_LABEL,
  categoryLabel,
  SOURCE_KIND_LABEL,
} from "@/features/catalogs/schemas/kind-labels";

export function SourceDatasheet({ spec }: { spec: SourceSpec }) {
  const rows: [string, string][] = [
    ["Familia", categoryLabel(spec.kind, SOURCE_KIND_LABEL)],
    [
      "Rango de fundamentales",
      `${spec.fundamentalRangeHz[0]}–${spec.fundamentalRangeHz[1]} Hz`,
    ],
    ["Contenido armónico", spec.harmonics],
    [
      "Energía acústica",
      `${categoryLabel(spec.acousticPower, ACOUSTIC_POWER_LABEL)}${
        spec.amplified ? " (amplificada)" : ""
      }`,
    ],
    [
      "Nivel de referencia",
      spec.referenceLevelDb !== undefined
        ? `${spec.referenceLevelDb} dB SPL`
        : "Sin publicar — se fija con la tabla de espectros del motor",
    ],
  ];

  if (spec.notes) rows.push(["Notas", spec.notes]);

  return <SpecDatasheet rows={rows} />;
}
