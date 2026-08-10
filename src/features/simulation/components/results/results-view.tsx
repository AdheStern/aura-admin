// src/features/simulation/components/results/results-view.tsx — el cuerpo de la vista (§5.4).
//
// Orden deliberado: primero el veredicto (alertas y qué hacer), después las cifras, y al final el
// detalle por banda. Quien abre esto quiere saber si la sala está bien antes que cuánto vale el C80
// a 2 kHz.
//
// Cada sección se pinta solo si el motor calculó lo suyo: un run solo estadístico no produce
// grillas, y un hueco vacío se lee como un fallo de la app.

import type { RoomDocument } from "@/features/room-editor/schemas/room-document";
import { AlertsPanel } from "@/features/simulation/components/results/alerts-panel";
import { BandChart } from "@/features/simulation/components/results/band-chart";
import { RecommendationCard } from "@/features/simulation/components/results/recommendation-card";
import { SplHistogram } from "@/features/simulation/components/results/spl-histogram";
import { SplMapPanel } from "@/features/simulation/components/results/spl-map-panel";
import { SummaryTiles } from "@/features/simulation/components/results/summary-tiles";
import { ValidityNotes } from "@/features/simulation/components/results/validity-notes";
import type { SimulationView } from "@/features/simulation/model/from-sim-results";

export function ResultsView({
  view,
  document,
  resolutionM,
}: {
  view: SimulationView;
  document: RoomDocument | null;
  resolutionM: number;
}) {
  const { bands, splGrid, recommendations } = view;
  const splValues = splGrid?.valuesDbA;

  return (
    <div className="flex flex-col gap-8">
      <AlertsPanel alerts={view.alerts} />

      {recommendations.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold">
            Recomendaciones
          </h2>
          <div className="grid gap-3 lg:grid-cols-2">
            {recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
              />
            ))}
          </div>
        </section>
      ) : null}

      <SummaryTiles scalars={view.scalars} />

      {splGrid ? (
        <SplMapPanel
          grid={splGrid}
          document={document}
          resolutionM={resolutionM}
        />
      ) : null}

      {splValues ? <SplHistogram values={splValues} /> : null}

      <section className="flex flex-col gap-6">
        <h2 className="font-heading text-lg font-semibold">
          Detalle por banda
        </h2>

        <BandChart
          title="Reverberación"
          unit="s"
          series={[
            { key: "rt60", label: "RT60", values: bands.rt60 },
            { key: "edt", label: "EDT", values: bands.edt },
          ]}
        />

        <BandChart
          title="Claridad"
          unit="dB"
          series={[
            { key: "c50", label: "C50", values: bands.c50 },
            { key: "c80", label: "C80", values: bands.c80 },
          ]}
        />
      </section>

      <ValidityNotes meta={view.meta} />
    </div>
  );
}
