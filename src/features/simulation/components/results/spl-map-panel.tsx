// src/features/simulation/components/results/spl-map-panel.tsx — el mapa y su selector de banda.
//
// "Global" es dBA y no la suma de las bandas: es la ponderación con la que se juzga un nivel, y es
// la que trae el contrato ya calculada. Las bandas sueltas van en dB sin ponderar, y por eso el
// selector cambia también la unidad que declara la leyenda.

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  OCTAVE_BAND_KEYS,
  type OctaveBandKey,
  type SimulationGrid,
} from "@/contracts";
import type { RoomDocument } from "@/features/room-editor/schemas/room-document";
import { SplMap } from "@/features/simulation/components/results/spl-map";

const GLOBAL = "global";

type Selection = OctaveBandKey | typeof GLOBAL;

export function SplMapPanel({
  grid,
  document,
  resolutionM,
}: {
  grid: SimulationGrid;
  document: RoomDocument | null;
  resolutionM: number;
}) {
  const bands = OCTAVE_BAND_KEYS.filter(
    (band) => grid.valuesDbByBand?.[band] !== undefined,
  );
  const [selected, setSelected] = useState<Selection>(
    grid.valuesDbA ? GLOBAL : (bands[0] ?? GLOBAL),
  );

  const values =
    selected === GLOBAL ? grid.valuesDbA : grid.valuesDbByBand?.[selected];
  if (!values) return null;

  const options: Selection[] = [
    ...(grid.valuesDbA ? [GLOBAL as Selection] : []),
    ...bands,
  ];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">
          Nivel en la audiencia
        </h2>

        <div className="flex flex-wrap gap-1">
          {options.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={option === selected ? "secondary" : "ghost"}
              aria-pressed={option === selected}
              onClick={() => setSelected(option)}
            >
              {option === GLOBAL ? "Global (dBA)" : `${option} Hz`}
            </Button>
          ))}
        </div>
      </div>

      <SplMap
        grid={grid}
        values={values}
        document={document}
        resolutionM={resolutionM}
        unit={selected === GLOBAL ? "dBA" : "dB"}
      />
    </section>
  );
}
