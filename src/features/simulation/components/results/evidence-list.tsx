// src/features/simulation/components/results/evidence-list.tsx — los pares clave/valor de una
// recomendación: su evidencia y los parámetros de la acción.
//
// `sourceId` se pinta con el nombre de la caja, no con el id del nodo. Es el mismo dato y el UUID no
// identifica nada para quien lee — sale del grafo, no del catálogo. Cuando no se puede resolver se
// deja el id crudo: es feo, pero inventarle un nombre a una caja que no está en el catálogo sería
// peor que enseñar el identificador que sí es cierto.

import type { SourceNames } from "@/features/simulation/model/source-names";

const SOURCE_KEYS = new Set(["sourceId", "speakerId"]);

export function EvidenceList({
  values,
  sourceNames,
}: {
  values: Record<string, unknown>;
  sourceNames: SourceNames;
}) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
      {Object.entries(values).map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{label(key)}</dt>
          <dd className="tabular-nums break-all">
            {format(key, value, sourceNames)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function label(key: string): string {
  return SOURCE_KEYS.has(key) ? "caja" : key;
}

function format(key: string, value: unknown, sourceNames: SourceNames): string {
  if (SOURCE_KEYS.has(key) && typeof value === "string") {
    return sourceNames.get(value) ?? value;
  }
  if (Array.isArray(value)) return value.join(", ");
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return String(value);
}
