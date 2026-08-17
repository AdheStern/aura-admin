// src/features/room-editor/components/panels/number-field.tsx — el par Label+Input numérico que
// se repite en todos los paneles de propiedades (posiciones, tamaños, cotas). Un solo sitio para
// el guardia de Number.isFinite: un campo vacío o "-" a medio teclear no debe disparar un comando.
//
// Recorta al rango SOLO si le dan los dos extremos. Con un `min` suelto no puede: teclear "0.08"
// pasa por "0.0", y recortarlo contra un mínimo de 0.05 dejaría el campo peleando con quien
// escribe. Con los dos extremos declarados el campo es uno acotado a propósito (el delay de una
// caja, por ejemplo) y ahí sí conviene que no se pueda escribir lo que el schema va a rechazar
// después — ese error salía al guardar, no al teclear.

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRoomStore } from "@/features/room-editor/store/room-store-provider";

export function NumberField({
  id,
  label,
  value,
  step = 0.1,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  const canManage = useRoomStore((state) => state.canManage);

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        disabled={!canManage}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (!Number.isFinite(next)) return;
          onChange(
            min !== undefined && max !== undefined
              ? Math.min(max, Math.max(min, next))
              : next,
          );
        }}
      />
    </div>
  );
}
