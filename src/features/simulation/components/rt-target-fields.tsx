// src/features/simulation/components/rt-target-fields.tsx — el objetivo de RT60 de la escena.
//
// Es lo que enciende `RtTargetRule`: sin un rango elegido el contrato manda `null` y el motor no
// evalúa nada (ADR 0003). Va en los DOS modos a propósito — "qué tipo de sala es esta" es
// justamente lo que un usuario de modo simple sabe contestar, y es lo que desbloquea la
// recomendación más accionable que hay.
//
// "Sin objetivo" es el valor por defecto y no un hueco por rellenar: recomendar tratamiento contra
// un rango que nadie eligió sería inventarle al usuario un criterio que no dio.

"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumberField } from "@/features/room-editor/components/panels/number-field";
import {
  formatTarget,
  isValidTarget,
  presetOf,
  RT_TARGET_PRESETS,
  type RtTarget,
} from "@/features/simulation/model/rt-target-presets";
import { useSimulationStore } from "@/features/simulation/store/simulation-store";

const NONE = "none";
const CUSTOM = "custom";

export function RtTargetFields() {
  const target = useSimulationStore(
    (state) => state.simulation.config.rtTargetS,
  );
  const canManage = useSimulationStore((state) => state.canManage);
  const setConfig = useSimulationStore((state) => state.setConfig);

  const preset = presetOf(target);
  // Solo hace falta estado local para un caso: elegir "Personalizado" cuando el rango que hay
  // coincide con un preset. Sin él, el select volvería solo al preset y los campos no aparecerían.
  const [forceCustom, setForceCustom] = useState(false);
  const selected =
    target === null ? NONE : forceCustom || !preset ? CUSTOM : preset.id;

  // `string | null` porque el Select de base-ui admite deseleccionar; aquí no hay hueco vacío
  // posible —"Sin objetivo" ya es una opción— así que un null se ignora.
  function select(value: string | null) {
    if (value === null) return;
    setForceCustom(value === CUSTOM);
    if (value === NONE) return setConfig({ rtTargetS: null });
    if (value === CUSTOM) {
      return setConfig({ rtTargetS: target ?? RT_TARGET_PRESETS[0].rangeS });
    }
    const chosen = RT_TARGET_PRESETS.find((item) => item.id === value);
    if (chosen) setConfig({ rtTargetS: chosen.rangeS });
  }

  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      <Label htmlFor="rt-target">Objetivo de reverberación</Label>

      <Select value={selected} onValueChange={select} disabled={!canManage}>
        <SelectTrigger id="rt-target">
          {/* Etiqueta explícita: los SelectItem llevan JSX compuesto (nombre · rango) y de ahí
              base-ui no sabe sacar un texto, así que pintaría el id crudo. */}
          <SelectValue>{() => labelOf(selected)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>Sin objetivo</SelectItem>
          {RT_TARGET_PRESETS.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label} · {formatTarget(item.rangeS)}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM}>Personalizado…</SelectItem>
        </SelectContent>
      </Select>

      {selected === NONE ? (
        <p className="text-xs text-muted-foreground">
          Sin objetivo no se evalúa el RT60 ni se sugiere tratamiento.
        </p>
      ) : null}

      {preset && !forceCustom ? (
        <p className="text-xs text-muted-foreground">{preset.hint}</p>
      ) : null}

      {selected === CUSTOM && target ? <CustomRange target={target} /> : null}
    </div>
  );
}

function labelOf(selected: string): string {
  if (selected === NONE) return "Sin objetivo";
  if (selected === CUSTOM) return "Personalizado";

  const preset = RT_TARGET_PRESETS.find((item) => item.id === selected);
  return preset ? `${preset.label} · ${formatTarget(preset.rangeS)}` : selected;
}

function CustomRange({ target }: { target: RtTarget }) {
  const setConfig = useSimulationStore((state) => state.setConfig);
  const [min, max] = target;

  return (
    <>
      <NumberField
        id="rt-target-min"
        label="RT60 mínimo (s)"
        value={min}
        step={0.1}
        min={0.1}
        onChange={(next) => setConfig({ rtTargetS: [next, max] })}
      />
      <NumberField
        id="rt-target-max"
        label="RT60 máximo (s)"
        value={max}
        step={0.1}
        min={0.1}
        onChange={(next) => setConfig({ rtTargetS: [min, next] })}
      />
      {isValidTarget(min, max) ? null : (
        // Mismo criterio que el `.refine()` del contrato: si esto llegara al motor lo pararía con
        // un INVALID_PAYLOAD que aquí no significaría nada para el usuario.
        <p className="text-xs text-destructive">
          El mínimo no puede ser mayor que el máximo.
        </p>
      )}
    </>
  );
}
