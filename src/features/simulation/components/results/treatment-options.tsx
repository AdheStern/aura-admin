// src/features/simulation/components/results/treatment-options.tsx — qué material y en qué muro.
//
// Es la mitad que el motor no puede resolver: entrega los m² sabin que faltan y no ve el catálogo
// (ADR-02). Aquí se convierten en algo que se puede comprar y colocar.
//
// Dice SIEMPRE en qué banda está dimensionado y que es una estimación de primer orden. Un número de
// metros sin esa frase se lee como un presupuesto de obra, y no lo es: Sabine supone la absorción
// repartida por igual, y el mismo panel que arregla los graves puede pasarse en los agudos.

import type { Treatment } from "@/features/simulation/queries/resolve-treatment";

export function TreatmentOptions({ treatment }: { treatment: Treatment }) {
  const verb = treatment.direction === "add" ? "Añadir" : "Quitar";

  return (
    <div className="rounded-md border p-3">
      <p className="mb-1 text-xs font-medium">
        {verb} {treatment.deltaAbsorptionM2.toFixed(1)} m² sabin en{" "}
        {treatment.bandHz} Hz
      </p>

      <ul className="flex flex-col gap-1.5">
        {treatment.suggestions.map((option) => (
          <li
            key={`${option.materialId}-${option.surfaceId}`}
            className="text-xs"
          >
            <span className="tabular-nums font-medium">
              {option.areaM2.toFixed(1)} m²
            </span>{" "}
            de {option.materialName} en {option.surfaceLabel}
            <span className="text-muted-foreground">
              {" "}
              · {Math.round(option.coverage * 100)} % de sus{" "}
              {option.surfaceAreaM2.toFixed(0)} m² · α {option.currentAlpha} →{" "}
              {option.alpha}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2 text-xs text-muted-foreground">
        Estimación de primer orden por Sabine inversa, dimensionada en{" "}
        {treatment.bandHz} Hz. Cubrir una superficie sustituye su absorción, no
        la suma: los metros ya cuentan con lo que ese material ya tenía.
      </p>
    </div>
  );
}
