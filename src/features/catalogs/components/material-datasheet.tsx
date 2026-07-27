// src/features/catalogs/components/material-datasheet.tsx — metadatos textuales; los
// coeficientes por banda van al gráfico (material-band-chart.tsx), no aquí.

import type { MaterialSpec } from "@/contracts/material-spec.schema";

export function MaterialDatasheet({ spec }: { spec: MaterialSpec }) {
  const rows: [string, string][] = [
    ["Nombre", spec.name],
    ["Categoría", spec.category],
    ["Fuente", spec.source],
    ["NRC", spec.nrc !== undefined ? spec.nrc.toFixed(2) : "—"],
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
