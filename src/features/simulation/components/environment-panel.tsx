// src/features/simulation/components/environment-panel.tsx — el panel de ambiente de §5.3:
// temperatura, humedad y ocupación de audiencia.
//
// FÍSICA de cada campo (§02): la temperatura fija la velocidad del sonido (c = 331.3 + 0.606·T) y
// con ella todos los retardos; la humedad gobierna la absorción del aire, que solo se nota por
// encima de 2 kHz y a distancias largas; y la ocupación es el mayor absorbente de una sala llena —
// el motor la aplica interpolando el material del piso de la zona de audiencia entre vacío y
// "audiencia sentada" (§6.2), no es un simple multiplicador.

"use client";

import { NumberField } from "@/features/room-editor/components/panels/number-field";
import { useSimulationStore } from "@/features/simulation/store/simulation-store";

export function EnvironmentPanel() {
  const environment = useSimulationStore(
    (state) => state.simulation.environment,
  );
  const setEnvironment = useSimulationStore((state) => state.setEnvironment);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase">
        Ambiente
      </h3>
      <NumberField
        id="environment-temperature"
        label="Temperatura (°C)"
        value={environment.temperatureC}
        step={0.5}
        onChange={(temperatureC) => setEnvironment({ temperatureC })}
      />
      <NumberField
        id="environment-humidity"
        label="Humedad (%)"
        value={environment.humidityPct}
        step={1}
        min={0}
        onChange={(humidityPct) => setEnvironment({ humidityPct })}
      />
      <NumberField
        id="environment-occupancy"
        label="Ocupación de audiencia (%)"
        value={environment.occupancyPct}
        step={5}
        min={0}
        onChange={(occupancyPct) => setEnvironment({ occupancyPct })}
      />
    </div>
  );
}
