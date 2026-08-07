// src/features/simulation/components/method-and-band-fields.tsx — las dos listas de casillas del
// modo avanzado: qué métodos componen el cálculo y qué bandas se analizan.
//
// Las dos comparten la misma regla y por eso viven juntas: no se puede dejar la lista vacía. El
// contrato exige min 1 en ambas, y una config sin método o sin banda no describe nada que calcular.

"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { OCTAVE_BANDS_HZ, type OctaveBandHz } from "@/contracts/bands";
import { useSimulationStore } from "@/features/simulation/store/simulation-store";

const METHODS = [
  { id: "statistical", label: "Estadístico" },
  { id: "hybrid", label: "Híbrido" },
  { id: "direct_field", label: "Campo directo" },
] as const;

type MethodId = (typeof METHODS)[number]["id"];

export function MethodAndBandFields() {
  const config = useSimulationStore((state) => state.simulation.config);
  const canManage = useSimulationStore((state) => state.canManage);
  const setConfig = useSimulationStore((state) => state.setConfig);

  function toggleMethod(id: MethodId, on: boolean) {
    const methods = on
      ? METHODS.filter(
          (method) => method.id === id || config.methods.includes(method.id),
        ).map((method) => method.id)
      : config.methods.filter((method) => method !== id);
    if (methods.length > 0) setConfig({ methods });
  }

  function toggleBand(band: OctaveBandHz, on: boolean) {
    const bands = on
      ? OCTAVE_BANDS_HZ.filter((b) => b === band || config.bands.includes(b))
      : config.bands.filter((b) => b !== band);
    if (bands.length > 0) setConfig({ bands: [...bands] });
  }

  return (
    <>
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
    </>
  );
}
