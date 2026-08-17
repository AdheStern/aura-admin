// src/features/room-editor/components/material-field.tsx — elegir el material de una superficie y,
// debajo, qué es lo que se acaba de elegir.
//
// El picker solo enseña el nombre, y el nombre no dice si el material absorbe: dos cortinas del
// mismo tejido con distinto plegado se llaman casi igual y tienen curvas muy distintas. Sin la
// ficha delante hay que salir al catálogo, mirar, volver y acordarse — con el recinto a medio
// asignar. Esta es la información que decide la elección, así que va donde se elige.
//
// Un solo componente para muro, pilar y abertura: las tres tienen material y ninguna razón para
// enseñarlo distinto.

"use client";

import type { MaterialSpec } from "@/contracts/material-spec.schema";
import { MaterialAbsorptionGrid } from "@/features/room-editor/components/material-absorption-grid";
import { MaterialSelect } from "@/features/room-editor/components/material-select";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function MaterialField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (materialId: string | null) => void;
}) {
  const spec = useRoomStore((state) =>
    value ? (state.materialSpecById.get(value) ?? null) : null,
  );

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm">Material</span>
      <MaterialSelect value={value} onChange={onChange} />
      {spec ? <MaterialCard spec={spec} /> : null}
    </div>
  );
}

function MaterialCard({ spec }: { spec: MaterialSpec }) {
  return (
    <div className="mt-1 flex flex-col gap-2.5 rounded-md bg-muted/50 p-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[11px] text-muted-foreground">
          {spec.category}
        </span>
        <span className="shrink-0 text-[11px] tabular-nums">
          NRC {spec.nrc !== undefined ? spec.nrc.toFixed(2) : "—"}
        </span>
      </div>

      <MaterialAbsorptionGrid absorption={spec.absorption} />

      {/* La procedencia va con el dato: el doc maestro exige que se sepa qué está medido y qué
          asumido, y en el catálogo el scattering casi nunca es lo primero. */}
      <p className="text-[10px] leading-snug text-muted-foreground">
        {spec.source}
      </p>
    </div>
  );
}
