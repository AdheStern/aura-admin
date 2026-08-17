// src/features/simulation/components/results/panel-advice-view.tsx — el tratamiento, ya propuesto.
//
// El plano manda y la lista lo explica: en el dibujo se ve DÓNDE de un vistazo, y al lado va el
// porqué de cada panel, que es lo que hace falta para decidir si el consejo tiene sentido.
//
// La planta que se dibuja es la CONGELADA con el consejo, no la de hoy: "muro 2, a 3 m de la
// esquina" solo significa algo contra la planta que vio el modelo, y sobre otra pondría los paneles
// en otro sitio sin avisar.

import { PanelPlan } from "@/features/simulation/components/results/panel-plan";
import {
  panelAreaM2,
  placePanel,
} from "@/features/simulation/model/panel-placement";
import type { StoredPanelAdvice } from "@/features/simulation/queries/get-panel-advice";

export function PanelAdviceView({ stored }: { stored: StoredPanelAdvice }) {
  const { advice, footprint, provider, model, generatedAt } = stored;

  const placed = advice.panels.flatMap((panel) => {
    const item = placePanel(footprint, panel);
    return item ? [item] : [];
  });
  if (placed.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Propuesto por {provider} · {model} · {formatDate(generatedAt)}
      </p>

      <p className="text-sm">{advice.summary}</p>

      <div className="flex flex-col gap-4 lg:flex-row">
        <PanelPlan footprint={footprint} placed={placed} />

        <ol className="flex flex-1 flex-col gap-2">
          {placed.map((item, index) => (
            <li
              key={`${item.panel.wallIndex}-${item.panel.startM}`}
              className="rounded-md border p-2"
            >
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-amber-950">
                  {index + 1}
                </span>
                <span className="text-sm font-medium">{item.panel.label}</span>
              </div>

              <p className="mt-1 font-mono text-xs text-muted-foreground tabular-nums">
                Muro {item.panel.wallIndex + 1} · a {round(item.panel.startM)} m
                de la esquina · {round(item.panel.lengthM)} ×{" "}
                {round(item.panel.heightM)} m ({panelAreaM2(item)} m²) · borde
                inferior a {round(item.panel.mountHeightM)} m del piso
              </p>

              {/* Recortar es corregir al modelo, y eso se dice: la cifra que se enseña ya no es
                  exactamente la que propuso. */}
              {item.clamped ? (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Ajustado para que quepa en el muro, que mide{" "}
                  {round(item.wallLengthM)} m.
                </p>
              ) : null}

              <p className="mt-1 text-xs text-muted-foreground">
                {item.panel.reason}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <p className="text-xs text-muted-foreground">
        <span className="font-medium">Material sugerido:</span>{" "}
        {advice.material}
      </p>
    </div>
  );
}

function round(value: number): string {
  return Number(value.toFixed(1)).toString();
}

/** Fecha ilegible no rompe la sección: el consejo sigue valiendo aunque su marca esté corrupta. */
function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "fecha desconocida"
    : date.toLocaleString("es", { dateStyle: "long", timeStyle: "short" });
}
