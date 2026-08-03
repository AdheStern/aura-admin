// src/features/catalogs/components/material-datasheet.tsx — metadatos textuales; los
// coeficientes por banda van al gráfico (material-band-chart.tsx), no aquí.

import type { MaterialSpec } from "@/contracts/material-spec.schema";
import { SpecDatasheet } from "@/features/catalogs/components/spec-datasheet";

export function MaterialDatasheet({ spec }: { spec: MaterialSpec }) {
  const rows: [string, string][] = [
    ["Nombre", spec.name],
    ["Categoría", spec.category],
    ["Fuente", spec.source],
    ["NRC", spec.nrc !== undefined ? spec.nrc.toFixed(2) : "—"],
  ];

  return <SpecDatasheet rows={rows} />;
}
