// src/features/simulation/components/advanced-config-fields.tsx — control total del modo avanzado
// (§01): método, orden ISM, rayos, bandas, resolución de grilla, altura de oído y tipo de suma.
//
// El orden ISM se ofrece 3–17 y no 0–17 como acepta el contrato: por debajo de 3 las reflexiones
// tempranas no alcanzan para una cola creíble, y el mínimo del schema existe para que el motor
// pueda pedir "solo directo" internamente, no para que lo elija el usuario (§5.3).
//
// La suma compleja es lo que distingue de verdad al modo avanzado: considera fase y polaridad, así
// que es la única que detecta cancelaciones entre cajas (§02).

"use client";

import { Button } from "@/components/ui/button";
import { NumberField } from "@/features/room-editor/components/panels/number-field";
import { MethodAndBandFields } from "@/features/simulation/components/method-and-band-fields";
import { useSimulationStore } from "@/features/simulation/store/simulation-store";

/** Las tres densidades de grilla de §5.3. La fina multiplica por cuatro los puntos a calcular. */
const RESOLUTIONS_M = [0.5, 1, 2] as const;

const ISM_MIN_ORDER = 3;
const ISM_MAX_ORDER = 17;
const DEFAULT_RAYS = 20_000;
const DEFAULT_SEED = 42;

export function AdvancedConfigFields() {
  const config = useSimulationStore((state) => state.simulation.config);
  const canManage = useSimulationStore((state) => state.canManage);
  const setConfig = useSimulationStore((state) => state.setConfig);

  return (
    <div className="flex flex-col gap-3">
      <MethodAndBandFields />

      <NumberField
        id="config-ism-order"
        label={`Orden ISM (${ISM_MIN_ORDER}–${ISM_MAX_ORDER})`}
        value={config.ism?.maxOrder ?? ISM_MIN_ORDER}
        step={1}
        min={ISM_MIN_ORDER}
        onChange={(maxOrder) =>
          setConfig({ ism: { maxOrder: clampOrder(maxOrder) } })
        }
      />
      <NumberField
        id="config-rays"
        label="Nº de rayos"
        value={config.rayTracing?.nRays ?? DEFAULT_RAYS}
        step={1000}
        min={1}
        onChange={(nRays) =>
          setConfig({
            rayTracing: {
              nRays: Math.max(1, Math.round(nRays)),
              seed: config.rayTracing?.seed ?? DEFAULT_SEED,
            },
          })
        }
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm">Resolución de grilla (m)</span>
        <div className="flex gap-1">
          {RESOLUTIONS_M.map((resolutionM) => (
            <Button
              key={resolutionM}
              variant={
                config.grid.resolutionM === resolutionM ? "default" : "outline"
              }
              size="sm"
              className="flex-1"
              disabled={!canManage}
              onClick={() =>
                setConfig({ grid: { ...config.grid, resolutionM } })
              }
            >
              {resolutionM}
            </Button>
          ))}
        </div>
      </div>

      <NumberField
        id="config-ear-height"
        label="Altura de oído (m)"
        value={config.grid.earHeightM}
        min={0.1}
        onChange={(earHeightM) =>
          setConfig({ grid: { ...config.grid, earHeightM } })
        }
      />

      <div className="flex flex-col gap-1.5">
        <span className="text-sm">Suma entre cajas</span>
        <div className="flex gap-1">
          {(["energy", "complex"] as const).map((summation) => (
            <Button
              key={summation}
              variant={config.summation === summation ? "default" : "outline"}
              size="sm"
              className="flex-1"
              disabled={!canManage}
              onClick={() => setConfig({ summation })}
            >
              {summation === "energy" ? "Energía" : "Compleja"}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function clampOrder(value: number): number {
  return Math.min(ISM_MAX_ORDER, Math.max(ISM_MIN_ORDER, Math.round(value)));
}
