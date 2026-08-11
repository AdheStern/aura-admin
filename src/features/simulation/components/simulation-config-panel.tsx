// src/features/simulation/components/simulation-config-panel.tsx — modo simple o avanzado (§5.3).
//
// Volver a simple RESTABLECE el preset entero en vez de conservar lo tecleado en avanzado: el modo
// simple es, por definición de §01, "el sistema elige el método", y un preset con la mitad de los
// valores del usuario no sería ni una cosa ni la otra. Pasar a avanzado sí conserva, porque ahí lo
// que se busca es partir de algo que funciona y tocarlo.

"use client";

import { Button } from "@/components/ui/button";
import { AdvancedConfigFields } from "@/features/simulation/components/advanced-config-fields";
import { RtTargetFields } from "@/features/simulation/components/rt-target-fields";
import { SIMPLE_CONFIG } from "@/features/simulation/schemas/scene-simulation";
import { useSimulationStore } from "@/features/simulation/store/simulation-store";

export function SimulationConfigPanel() {
  const config = useSimulationStore((state) => state.simulation.config);
  const canManage = useSimulationStore((state) => state.canManage);
  const setConfig = useSimulationStore((state) => state.setConfig);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase">
        Simulación
      </h3>

      {canManage ? (
        <div className="flex gap-1">
          <Button
            variant={config.mode === "simple" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            // rtTargetS sobrevive al reset: describe la SALA, no cómo se calcula, y perderlo al
            // cambiar de modo descartaría en silencio algo que el usuario eligió aparte.
            onClick={() =>
              setConfig({ ...SIMPLE_CONFIG, rtTargetS: config.rtTargetS })
            }
          >
            Simple
          </Button>
          <Button
            variant={config.mode === "advanced" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setConfig({ mode: "advanced" })}
          >
            Avanzado
          </Button>
        </div>
      ) : null}

      {config.mode === "simple" ? (
        <p className="text-xs text-muted-foreground">
          Preset híbrido con grilla de {config.grid.resolutionM} m y suma en
          energía. El sistema elige el método.
        </p>
      ) : (
        <AdvancedConfigFields />
      )}

      {/* Fuera del if: el objetivo describe la SALA, no cómo se calcula, y quien usa el modo
          simple es quien más partido le saca a que le digan cuánto absorbente le falta. */}
      <RtTargetFields />
    </div>
  );
}
