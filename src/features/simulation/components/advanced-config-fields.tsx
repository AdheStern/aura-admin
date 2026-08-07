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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OCTAVE_BANDS_HZ, type OctaveBandHz } from "@/contracts/bands";
import { NumberField } from "@/features/room-editor/components/panels/number-field";
import { useSimulationStore } from "@/features/simulation/store/simulation-store";

const METHODS = [
  { id: "statistical", label: "Estadístico" },
  { id: "hybrid", label: "Híbrido" },
  { id: "direct_field", label: "Campo directo" },
] as const;

/** Las tres densidades de grilla de §5.3. La fina multiplica por cuatro los puntos a calcular. */
const RESOLUTIONS_M = [0.5, 1, 2] as const;

const ISM_MIN_ORDER = 3;
const ISM_MAX_ORDER = 17;

export function AdvancedConfigFields() {
  const config = useSimulationStore((state) => state.simulation.config);
  const canManage = useSimulationStore((state) => state.canManage);
  const setConfig = useSimulationStore((state) => state.setConfig);

  function toggleMethod(id: (typeof METHODS)[number]["id"], on: boolean) {
    const methods = on
      ? [...config.methods, id]
      : config.methods.filter((method) => method !== id);
    // Al menos uno: el contrato lo exige y sin método no hay nada que calcular.
    if (methods.length > 0) setConfig({ methods });
  }

  function toggleBand(band: OctaveBandHz, on: boolean) {
    const bands = on
      ? OCTAVE_BANDS_HZ.filter((b) => b === band || config.bands.includes(b))
      : config.bands.filter((b) => b !== band);
    if (bands.length > 0) setConfig({ bands: [...bands] });
  }

  return (
    <div className="flex flex-col gap-3">
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm">Métodos</legend>
        {METHODS.map((method) => (
          <div key={method.id} className="flex items-center gap-2">
            <Checkbox
              id={`method-${method.id}`}
              checked={config.methods.includes(method.id)}
              disabled={!canManage}
              onCheckedChange={(checked) =>
                toggleMethod(method.id, checked === true)
              }
            />
            <Label htmlFor={`method-${method.id}`}>{method.label}</Label>
          </div>
        ))}
      </fieldset>

      <NumberField
        id="config-ism-order"
        label={`Orden ISM (${ISM_MIN_ORDER}–${ISM_MAX_ORDER})`}
        value={config.ism?.maxOrder ?? ISM_MIN_ORDER}
        step={1}
        min={ISM_MIN_ORDER}
        onChange={(maxOrder) =>
          setConfig({
            ism: {
              maxOrder: Math.min(
                ISM_MAX_ORDER,
                Math.max(ISM_MIN_ORDER, Math.round(maxOrder)),
              ),
            },
          })
        }
      />
      <NumberField
        id="config-rays"
        label="Nº de rayos"
        value={config.rayTracing?.nRays ?? 20_000}
        step={1000}
        min={1}
        onChange={(nRays) =>
          setConfig({
            rayTracing: {
              nRays: Math.max(1, Math.round(nRays)),
              seed: config.rayTracing?.seed ?? 42,
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

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm">Bandas (Hz)</legend>
        <div className="flex flex-wrap gap-2">
          {OCTAVE_BANDS_HZ.map((band) => (
            <div key={band} className="flex items-center gap-1">
              <Checkbox
                id={`band-${band}`}
                checked={config.bands.includes(band)}
                disabled={!canManage}
                onCheckedChange={(checked) =>
                  toggleBand(band, checked === true)
                }
              />
              <Label htmlFor={`band-${band}`}>{band}</Label>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm">Suma entre cajas</span>
        <div className="flex gap-1">
          <Button
            variant={config.summation === "energy" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            disabled={!canManage}
            onClick={() => setConfig({ summation: "energy" })}
          >
            Energía
          </Button>
          <Button
            variant={config.summation === "complex" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            disabled={!canManage}
            onClick={() => setConfig({ summation: "complex" })}
          >
            Compleja
          </Button>
        </div>
      </div>
    </div>
  );
}
